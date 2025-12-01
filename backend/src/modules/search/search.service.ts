import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from '../books/schemas/book.schema';
import { ChromaService } from '../chroma/chroma.service';

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        @InjectModel(Book.name) private bookModel: Model<Book>,
        private chromaService: ChromaService,
    ) { }

    /**
     * UNIFIED Semantic Search - Book Centric (Hybrid: Vector + Keyword)
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

        // 1. Run Vector Search & Keyword Search in parallel
        const [vectorResults, keywordBooks] = await Promise.all([
            this.chromaService.getVectorStore().similaritySearchWithScore(query, limit * 5),
            this.bookModel.find({
                title: { $regex: query, $options: 'i' },
                status: 'published'
            }).select('_id title slug coverUrl authorId genres description').limit(5).lean()
        ]);

        // 2. Group results by bookId
        const bookGroups = new Map<string, {
            bookScore: number;
            chapters: Map<string, any>; // Use Map to deduplicate chapters/chunks
            snippets: string[];
            bookMetadata?: any;
            isKeywordMatch?: boolean;
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
            // Cap at 1.0 (or slightly above to ensure top rank)
            if (group.bookScore > 1.2) group.bookScore = 1.2;
        }

        // 3. Fetch full book details for vector matches (keyword matches already have some details, but we fetch all to be safe/consistent)
        const bookIds = Array.from(bookGroups.keys());
        if (bookIds.length === 0) return [];

        const books = await this.bookModel.find({ _id: { $in: bookIds } })
            .populate('authorId', 'name')
            .populate('genres', 'name')
            .lean();

        const bookMap = new Map(books.map(b => [b._id.toString(), b]));

        // 4. Format final response
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
                isKeywordMatch: group.isKeywordMatch || false
            });
        }

        // 5. Sort by final book score and limit
        return formattedResults
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }
}
