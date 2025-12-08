import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from '../books/schemas/book.schema';
import { Author } from '../authors/schemas/author.schema';
import { ChromaService } from '../chroma/chroma.service';

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        @InjectModel(Book.name) private bookModel: Model<Book>,
        @InjectModel(Author.name) private authorModel: Model<Author>,
        private chromaService: ChromaService,
    ) { }

    /**
     * UNIFIED Semantic Search - Book Centric (Hybrid: Vector + Keyword + Author-Aware)
     * Trả về danh sách SÁCH, kèm theo các chapter liên quan nhất
     */
    async semanticSearch(
        query: string,
        options: {
            limit?: number;
            minScore?: number;
        } = {},
    ) {
        const { limit = 10, minScore = 0.1 } = options;

        // 1. Run Vector Search, Keyword Search, and Author Search in parallel
        const [vectorResults, keywordBooks, matchingAuthors] = await Promise.all([
            this.chromaService.getVectorStore().similaritySearchWithScore(query, limit * 5),
            this.bookModel.find({
                title: { $regex: query, $options: 'i' },
                status: 'published'
            }).select('_id title slug coverUrl authorId genres description').limit(5).lean(),
            // NEW: Search for authors matching the query
            this.authorModel.find({
                name: { $regex: query, $options: 'i' }
            }).select('_id name').limit(5).lean()
        ]);

        // 2. Get books by matching authors
        const authorBookIds: string[] = [];
        if (matchingAuthors.length > 0) {
            const authorIds = matchingAuthors.map(a => a._id);
            const authorBooks = await this.bookModel.find({
                authorId: { $in: authorIds },
                status: 'published'
            }).select('_id').limit(20).lean();
            authorBookIds.push(...authorBooks.map(b => b._id.toString()));

            this.logger.log(`🔍 Found ${matchingAuthors.length} matching authors with ${authorBookIds.length} books`);
        }

        // 3. Group results by bookId
        const bookGroups = new Map<string, {
            bookScore: number;
            chapters: Map<string, any>; // Use Map to deduplicate chapters/chunks
            snippets: string[];
            bookMetadata?: any;
            isKeywordMatch?: boolean;
            isAuthorMatch?: boolean;
            matchedAuthor?: string;
        }>();

        // Process Vector Results
        for (const [doc, distance] of vectorResults) {
            const similarity = Math.max(0, 1 - distance);
            if (similarity < minScore) continue;

            const type = doc.metadata.type;
            const bookId = doc.metadata.bookId;

            if (!bookId) continue;

            if (!bookGroups.has(bookId)) {
                bookGroups.set(bookId, {
                    bookScore: 0,
                    chapters: new Map(),
                    snippets: [],
                });
            }

            const group = bookGroups.get(bookId)!;

            if (type === 'book') {
                group.bookScore = Math.max(group.bookScore, similarity);
                group.bookMetadata = doc.metadata;
                group.snippets.push(`Khớp với thông tin sách: "${doc.pageContent.substring(0, 100)}..."`);
            } else if (type === 'chapter') {
                const chapterId = doc.metadata.chapterId;
                const currentChapter = group.chapters.get(chapterId);

                // If we already have this chapter, only update if this chunk is more relevant
                if (!currentChapter || similarity > currentChapter.relevanceScore) {
                    group.chapters.set(chapterId, {
                        chapterId: doc.metadata.chapterId,
                        chapterTitle: doc.metadata.chapterTitle,
                        chapterSlug: doc.metadata.chapterSlug,
                        orderIndex: doc.metadata.orderIndex,
                        excerpt: doc.pageContent.substring(0, 150) + '...',
                        relevanceScore: similarity,
                    });
                }

                // Update book score based on best chapter match
                group.bookScore = Math.max(group.bookScore, similarity * 0.9);
                group.snippets.push(`Khớp với chương ${doc.metadata.orderIndex}: "${doc.pageContent.substring(0, 100)}..."`);
            }
        }

        // Process Keyword Results (Boost scores)
        for (const book of keywordBooks) {
            const bookId = book._id.toString();
            if (!bookGroups.has(bookId)) {
                bookGroups.set(bookId, {
                    bookScore: 0, // Will be boosted below
                    chapters: new Map(),
                    snippets: [`Khớp chính xác tiêu đề sách: "${book.title}"`],
                    isKeywordMatch: true
                });
            }

            const group = bookGroups.get(bookId)!;
            group.isKeywordMatch = true;
            // Boost score: Ensure it's at least 0.8, or boost existing score
            group.bookScore = Math.max(group.bookScore + 0.3, 0.8);
            // Cap at 1.2 to ensure top rank but allow author matches to rank higher
            if (group.bookScore > 1.2) group.bookScore = 1.2;
        }

        // NEW: Process Author Matches (Highest boost)
        for (const bookId of authorBookIds) {
            if (!bookGroups.has(bookId)) {
                bookGroups.set(bookId, {
                    bookScore: 0, // Will be boosted below
                    chapters: new Map(),
                    snippets: [],
                    isAuthorMatch: true
                });
            }

            const group = bookGroups.get(bookId)!;
            group.isAuthorMatch = true;

            // Find the matching author name
            const matchedAuthor = matchingAuthors.find(a =>
                authorBookIds.includes(bookId)
            );
            if (matchedAuthor) {
                group.matchedAuthor = matchedAuthor.name;
                group.snippets.unshift(`Khớp với tác giả: "${matchedAuthor.name}"`);
            }

            // Give highest boost to author matches - ensure they rank at top
            group.bookScore = Math.max(group.bookScore + 0.5, 1.5);
            // Cap at 2.0 to ensure author matches are always on top
            if (group.bookScore > 2.0) group.bookScore = 2.0;
        }

        // 4. Fetch full book details for all matches
        const bookIds = Array.from(bookGroups.keys());
        if (bookIds.length === 0) return [];

        const books = await this.bookModel.find({ _id: { $in: bookIds } })
            .populate('authorId', 'name')
            .populate('genres', 'name')
            .lean();

        const bookMap = new Map(books.map(b => [b._id.toString(), b]));

        // 5. Format final response
        const formattedResults: any[] = [];

        for (const [bookId, group] of bookGroups) {
            const bookDetails = bookMap.get(bookId);
            if (!bookDetails) continue;

            // Convert chapters map to array and sort
            const topChapters = Array.from(group.chapters.values())
                .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
                .slice(0, 3);

            formattedResults.push({
                type: 'book',
                bookId: bookDetails._id,
                title: bookDetails.title,
                slug: bookDetails.slug,
                author: (bookDetails.authorId as any)?.name || 'Unknown',
                genres: bookDetails.genres?.map((g: any) => g.name).join(', ') || '',
                description: bookDetails.description?.substring(0, 200) + '...',
                coverUrl: bookDetails.coverUrl,
                relevanceScore: group.bookScore,
                topChapters: topChapters,
                evidenceSnippets: group.snippets.slice(0, 3),
                isKeywordMatch: group.isKeywordMatch || false,
                isAuthorMatch: group.isAuthorMatch || false
            });
        }

        // 6. Sort by final book score and limit
        return formattedResults
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }
}
