import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChromaService } from '../chroma/chroma.service';
import { Book } from '../books/schemas/book.schema';
import { Author } from '../authors/schemas/author.schema';
import { Chapter } from '../chapters/schemas/chapter.schema';
import { Genre } from '../genres/schemas/genre.schema';
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
        @InjectModel(Chapter.name) private chapterModel: Model<Chapter>,
        @InjectModel(Genre.name) private genreModel: Model<Genre>,
    ) { }

    /**
     * ============================================
     * MAIN SEARCH ALGORITHM WITH PAGINATION
     * ============================================
     * 1. FUZZY SEARCH (MongoDB): Tên sách + Tên tác giả
     * 2. SEMANTIC SEARCH (ChromaDB): Description của book
     * 3. Merge & Sort results
     * 4. Apply filters & pagination
     */
    async intelligentSearch(searchQueryDto: SearchQueryDto): Promise<{
        data: any[];
        metaData: { page: number; limit: number; total: number; totalPages: number };
    }> {
        const {
            query,
            page = 1,
            limit = 20,
            genres,
            tags,
            sortBy = 'relevance',
            order = 'desc'
        } = searchQueryDto;

        const validLimit = Math.min(Math.max(limit, 1), 100);
        const skip = (page - 1) * validLimit;

        this.logger.log(`\n🔍 ===== SEARCH: "${query}" (page: ${page}, limit: ${validLimit}) =====`);

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
            let allResults = this.mergeAndDeduplicate(fuzzyMatches, semanticMatches);

            // ============================================
            // STEP 4: Filter by genres and tags
            // ============================================
            if (genres || tags) {
                allResults = await this.applyFilters(allResults, genres, tags);
            }

            // ============================================
            // STEP 5: Sort
            // ============================================
            allResults = this.applySorting(allResults, sortBy, order);

            // ============================================
            // STEP 6: Pagination
            // ============================================
            const total = allResults.length;
            const totalPages = Math.ceil(total / validLimit);
            const paginatedResults = allResults.slice(skip, skip + validLimit);

            // ============================================
            // STEP 7: Fetch full book details
            // ============================================
            const bookIds = paginatedResults
                .filter(r => r.type === 'book')
                .map(r => r.id);

            const books = await this.bookModel
                .find({ _id: { $in: bookIds } })
                .populate('authorId', 'name')
                .populate('genres', 'name slug')
                .lean();

            // Map books to maintain search result order and add stats
            const booksMap = new Map(books.map(b => [b._id.toString(), b]));
            const enrichedBooks = await Promise.all(
                paginatedResults.map(async (result) => {
                    const book = booksMap.get(result.id);
                    if (!book) return null;

                    // Get chapter count
                    const chaptersCount = await this.chapterModel.countDocuments({ bookId: book._id });

                    return {
                        ...book,
                        id: book._id.toString(),
                        stats: {
                            chapters: chaptersCount,
                            views: book.views || 0,
                            likes: book.likes || 0,
                            rating: 0, // Will be calculated if needed
                            reviews: 0,
                        },
                        relevanceScore: result.score,
                    };
                })
            );

            const finalData = enrichedBooks.filter(b => b !== null);

            this.logger.log(`✅ Returning ${finalData.length} of ${total} results (page ${page}/${totalPages})\n`);

            return {
                data: finalData,
                metaData: {
                    page,
                    limit: validLimit,
                    total,
                    totalPages,
                },
            };

        } catch (error) {
            this.logger.error(`❌ Search error: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Apply genre and tag filters to search results
     */
    private async applyFilters(results: SearchResult[], genres?: string, tags?: string): Promise<SearchResult[]> {
        if (!genres && !tags) return results;

        const bookIds = results.filter(r => r.type === 'book').map(r => r.id);
        const matchStage: any = { _id: { $in: bookIds } };

        if (genres) {
            const genreSlugs = genres.split(',').map(g => g.trim());
            const genreDocs = await this.genreModel.find({ slug: { $in: genreSlugs } }).select('_id');
            const genreIds = genreDocs.map(doc => doc._id);
            if (genreIds.length > 0) {
                matchStage.genres = { $in: genreIds };
            }
        }

        if (tags) {
            const tagsList = tags.split(',').map(t => t.trim());
            matchStage.tags = { $in: tagsList };
        }

        const filteredBooks = await this.bookModel.find(matchStage).select('_id').lean();
        const filteredIds = new Set(filteredBooks.map(b => b._id.toString()));

        return results.filter(r => r.type !== 'book' || filteredIds.has(r.id));
    }

    /**
     * Apply sorting to search results
     */
    private applySorting(results: SearchResult[], sortBy: string, order: string): SearchResult[] {
        const sortOrder = order === 'asc' ? 1 : -1;

        if (sortBy === 'relevance') {
            // Default: sort by score (relevance)
            return results.sort((a, b) => sortOrder * (b.score - a.score));
        }

        // For other sort options, we'll need the full book data
        // This is handled in the final enrichment step
        return results;
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
