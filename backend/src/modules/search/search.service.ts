import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChromaService } from '../chroma/chroma.service';
import { Book } from '../books/schemas/book.schema';
import { Author } from '../authors/schemas/author.schema';
import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchResult {
    type: 'book' | 'author';
    id: string;
    title: string;
    score: number;
    data: any;
    excerpt?: string;
}

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private readonly chromaService: ChromaService,
        @InjectModel(Book.name) private bookModel: Model<Book>,
        @InjectModel(Author.name) private authorModel: Model<Author>,
    ) { }

    /**
     * ============================================
     * MAIN SEARCH ALGORITHM
     * ============================================
     * 1. FUZZY SEARCH (MongoDB): Tên sách + Tên tác giả
     * 2. SEMANTIC SEARCH (ChromaDB): Description của book
     * 3. Merge & Sort results
     */
    async intelligentSearch(searchQueryDto: SearchQueryDto): Promise<SearchResult[]> {
        const { query, limit = 10 } = searchQueryDto;

        this.logger.log(`\n🔍 ===== SEARCH: "${query}" (limit: ${limit}) =====`);

        try {
            // ============================================
            // STEP 1: FUZZY SEARCH - Tên sách & Tác giả
            // ============================================
            const fuzzyMatches = await this.fuzzySearchTitleAuthor(query);

            if (fuzzyMatches.length > 0) {
                this.logger.log(`📌 Fuzzy search found ${fuzzyMatches.length} exact/partial matches`);
            }

            // ============================================
            // STEP 2: SEMANTIC SEARCH - Book Descriptions
            // ============================================
            const semanticMatches = await this.semanticSearchBooks(query);

            if (semanticMatches.length > 0) {
                this.logger.log(`🧠 Semantic search found ${semanticMatches.length} description matches`);
            }

            // ============================================
            // STEP 3: Merge & Deduplicate
            // ============================================
            const allResults = this.mergeAndDeduplicate(fuzzyMatches, semanticMatches);

            // ============================================
            // STEP 4: Sort & Limit
            // ============================================
            const finalResults = allResults
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            this.logger.log(`✅ Returning ${finalResults.length} results`);
            this.logger.log(`   Types: ${finalResults.filter(r => r.type === 'book').length} books, ${finalResults.filter(r => r.type === 'author').length} authors\n`);

            return finalResults;

        } catch (error) {
            this.logger.error(`❌ Search error: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * ============================================
     * FUZZY SEARCH - Tên sách & Tác giả
     * ============================================
     * MongoDB regex search cho:
     * - Book titles
     * - Author names
     * Returns high-priority results (score 10.0-15.0)
     */
    private async fuzzySearchTitleAuthor(query: string): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const normalizedQuery = this.normalizeText(query);

        // Skip nếu query quá ngắn hoặc quá dài
        if (normalizedQuery.length < 2) {
            return results;
        }

        const originalWords = query.trim().split(/\s+/).filter(w => w.length > 1);

        // Skip nếu query quá dài (>6 words) - có thể là descriptive sentence
        if (originalWords.length > 6) {
            this.logger.debug(`⏭️  Skipping fuzzy search for long query (${originalWords.length} words)`);
            return results;
        }

        try {

            const requiredWords = originalWords.slice(0, Math.ceil(originalWords.length * 0.7));
            const regexPattern = originalWords.length <= 3
                ? originalWords.join('.*')
                : requiredWords.join('|');

            const regex = new RegExp(regexPattern, 'i');

            // ============================================
            // 1. Search Books by Title
            // ============================================
            const books = await this.bookModel
                .find({
                    title: { $regex: regex },
                    status: 'published'
                })
                .populate('authorId', 'name')
                .populate('genres', 'name')
                .limit(20)
                .lean();

            for (const book of books) {
                const similarity = this.calculateTextSimilarity(query, book.title);

                // Keep exact, starts-with, and contains matches
                if (similarity >= 0.6) {
                    let score = 0;
                    if (similarity >= 1.0) score = 15.0;      // Exact match
                    else if (similarity >= 0.8) score = 12.0; // Starts with
                    else if (similarity >= 0.6) score = 10.0; // Contains

                    results.push({
                        type: 'book',
                        id: book._id.toString(),
                        title: book.title,
                        score,
                        data: {
                            slug: book.slug,
                            author: (book.authorId as any)?.name || 'Unknown',
                            genres: book.genres?.map((g: any) => g.name).join(', ') || '',
                            description: book.description?.substring(0, 200) || '',
                            coverUrl: book.coverUrl,
                        },
                        excerpt: `Exact title match: ${book.title}`,
                    });

                    this.logger.debug(`📖 Fuzzy BOOK: "${book.title}" (similarity: ${similarity.toFixed(2)}, score: ${score})`);
                }
            }

            // ============================================
            // 2. Search Authors by Name
            // ============================================
            const authors = await this.authorModel
                .find({ name: { $regex: regex } })
                .limit(10)
                .lean();

            for (const author of authors) {
                const similarity = this.calculateTextSimilarity(query, author.name);

                // Keep exact, starts-with, and contains matches
                if (similarity >= 0.6) {
                    let score = 0;
                    if (similarity >= 1.0) score = 15.0;      // Exact match
                    else if (similarity >= 0.8) score = 12.0; // Starts with
                    else if (similarity >= 0.6) score = 10.0; // Contains

                    results.push({
                        type: 'author',
                        id: author._id.toString(),
                        title: author.name,
                        score,
                        data: {
                            bio: author.bio?.substring(0, 200) || '',
                            photoUrl: author.photoUrl,
                        },
                        excerpt: `Exact author match: ${author.name}`,
                    });

                    this.logger.debug(`👤 Fuzzy AUTHOR: "${author.name}" (similarity: ${similarity.toFixed(2)}, score: ${score})`);

                    // ⭐ Fetch books by this author
                    const authorBooks = await this.bookModel
                        .find({ authorId: author._id, status: 'published' })
                        .populate('authorId', 'name')
                        .populate('genres', 'name')
                        .limit(10)
                        .lean();

                    for (const book of authorBooks) {
                        results.push({
                            type: 'book',
                            id: book._id.toString(),
                            title: book.title,
                            score: score * 0.9, // Books inherit 90% of author score
                            data: {
                                slug: book.slug,
                                author: (book.authorId as any)?.name || 'Unknown',
                                genres: book.genres?.map((g: any) => g.name).join(', ') || '',
                                description: book.description?.substring(0, 200) || '',
                                coverUrl: book.coverUrl,
                            },
                            excerpt: `By author: ${author.name}`,
                        });

                        this.logger.debug(`  📖 Book by author: "${book.title}" (score: ${(score * 0.9).toFixed(1)})`);
                    }
                }
            }

        } catch (error) {
            this.logger.error(`❌ Fuzzy search error: ${error.message}`);
        }

        return results;
    }

    /**
     * ============================================
     * SEMANTIC SEARCH - Book Descriptions ONLY
     * ============================================
     * ChromaDB vector search on book descriptions
     * Returns semantic matches (score 0.0-1.0)
     */
    private async semanticSearchBooks(query: string): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        try {
            const vectorStore = this.chromaService.getVectorStore();
            const rawResults = await vectorStore.similaritySearchWithScore(query, 50);

            this.logger.debug(`📊 ChromaDB returned ${rawResults.length} results`);

            if (rawResults.length === 0) {
                return results;
            }

            // Collect unique book IDs
            const bookIds: string[] = [];
            const bookScores = new Map<string, number>();

            for (const [doc, distance] of rawResults) {
                const { type, bookId } = doc.metadata;
                const score = 1 / (1 + distance);

                // 🔍 DEBUG: Log ALL results including skipped ones
                this.logger.debug(`📊 Raw ChromaDB: type=${type}, bookId=${bookId}, distance=${distance.toFixed(3)}, score=${score.toFixed(3)}`);

                // ⚠️ ONLY process book entities, skip authors entirely
                if (type !== 'book' || !bookId) {
                    this.logger.debug(`⏭️  Skipped: type=${type}, bookId=${bookId}`);
                    continue;
                }

                // Keep highest score for each book
                if (!bookScores.has(bookId) || bookScores.get(bookId)! < score) {
                    bookScores.set(bookId, score);
                    if (!bookIds.includes(bookId)) {
                        bookIds.push(bookId);
                    }
                }
            }

            // Fetch book data from DB
            if (bookIds.length > 0) {
                const books = await this.bookModel
                    .find({ _id: { $in: bookIds }, status: 'published' })
                    .populate('authorId', 'name')
                    .populate('genres', 'name')
                    .lean();

                for (const book of books) {
                    const bookId = book._id.toString();
                    const score = bookScores.get(bookId) || 0;

                    // Filter out very low scores (TEMPORARY: lowered for debugging)
                    if (score < 0.3) continue;

                    results.push({
                        type: 'book',
                        id: bookId,
                        title: book.title,
                        score,
                        data: {
                            slug: book.slug,
                            author: (book.authorId as any)?.name || 'Unknown',
                            genres: book.genres?.map((g: any) => g.name).join(', ') || '',
                            description: book.description?.substring(0, 200) || '',
                            coverUrl: book.coverUrl,
                        },
                        excerpt: book.description?.substring(0, 150) || '',
                    });

                    this.logger.debug(`🧠 Semantic BOOK: "${book.title}" (score: ${score.toFixed(3)})`);
                }
            }

        } catch (error) {
            this.logger.error(`❌ Semantic search error: ${error.message}`);
        }

        return results;
    }

    /**
     * ============================================
     * MERGE & DEDUPLICATE
     * ============================================
     * Merge fuzzy + semantic results
     * Keep highest score for duplicates
     */
    private mergeAndDeduplicate(fuzzyResults: SearchResult[], semanticResults: SearchResult[]): SearchResult[] {
        const resultMap = new Map<string, SearchResult>();

        // Add fuzzy results first (higher priority)
        for (const result of fuzzyResults) {
            const key = `${result.type}-${result.id}`;
            resultMap.set(key, result);
        }

        // Merge semantic results
        for (const result of semanticResults) {
            const key = `${result.type}-${result.id}`;
            const existing = resultMap.get(key);

            if (!existing) {
                // New result
                resultMap.set(key, result);
            } else if (result.score > existing.score) {
                // Update if semantic score is higher (rare)
                this.logger.debug(`🔄 Updating ${key}: ${existing.score.toFixed(2)} → ${result.score.toFixed(2)}`);
                resultMap.set(key, result);
            }
        }

        return Array.from(resultMap.values());
    }

    /**
     * ============================================
     * HELPER: Normalize text
     * ============================================
     */
    private normalizeText(text: string): string {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    /**
     * ============================================
     * HELPER: Calculate text similarity
     * ============================================
     * Returns: 1.0 (exact), 0.8 (starts with), 0.6 (contains), 0.0 (no match)
     */
    private calculateTextSimilarity(query: string, targetText: string): number {
        if (!query || !targetText) return 0.0;

        const normalizedQuery = this.normalizeText(query);
        const normalizedTarget = this.normalizeText(targetText);

        if (normalizedTarget === normalizedQuery) {
            return 1.0; // Exact match
        } else if (normalizedTarget.startsWith(normalizedQuery)) {
            return 0.8; // Starts with
        } else if (normalizedTarget.includes(normalizedQuery)) {
            return 0.6; // Contains
        }
        return 0.0; // No match
    }
}
