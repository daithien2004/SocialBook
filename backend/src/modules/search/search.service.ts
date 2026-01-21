import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChromaService } from '../chroma/chroma.service';
import { Book } from '../books/schemas/book.schema';
import { Author } from '../authors/schemas/author.schema';
import { Chapter } from '../chapters/schemas/chapter.schema';
import { Review } from '../reviews/schemas/review.schema';
import { Genre } from '../genres/schemas/genre.schema';
import { SearchQueryDto } from './dto/search-query.dto';

export interface BookStats {
    chapters: number;
    views: number;
    likes: number;
    rating: number;
    reviews: number;
}

export interface SearchResultBook {
    id: string;
    _id: string;
    title: string;
    slug: string;
    description?: string;
    coverUrl?: string;
    status: string;
    tags?: string[];
    views: number;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
    authorId: {
        _id: string;
        name: string;
        avatar?: string;
    };
    genres: Array<{
        _id: string;
        name: string;
        slug: string;
    }>;
    stats: BookStats;
    score: number;
    matchType?: string;
}

export interface PaginatedSearchResult {
    data: SearchResultBook[];
    metaData: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private readonly chromaService: ChromaService,
        @InjectModel(Book.name) private bookModel: Model<Book>,
        @InjectModel(Author.name) private authorModel: Model<Author>,
        @InjectModel(Chapter.name) private chapterModel: Model<Chapter>,
        @InjectModel(Review.name) private reviewModel: Model<Review>,
        @InjectModel(Genre.name) private genreModel: Model<Genre>,
    ) { }

    /**
     * ============================================
     * MAIN SEARCH ALGORITHM (với Pagination & Filters)
     * ============================================
     */
    async intelligentSearch(searchQueryDto: SearchQueryDto): Promise<PaginatedSearchResult> {
        const {
            query,
            page = 1,
            limit = 12,
            genres,
            author,
            tags,
            sortBy = 'score',
            order = 'desc'
        } = searchQueryDto;

        try {
            // ============================================
            // STEP 1: FUZZY + SEMANTIC + DESCRIPTION KEYWORD SEARCH
            // ============================================
            const [fuzzyBookIds, semanticBookIds, descriptionBookIds] = await Promise.all([
                this.fuzzySearchBookIds(query),
                this.semanticSearchBookIds(query),
                this.descriptionKeywordSearch(query),
            ]);

            // Merge book IDs with scores
            const bookScoreMap = new Map<string, { score: number; matchType: string }>();

            for (const { id, score, matchType } of fuzzyBookIds) {
                bookScoreMap.set(id, { score, matchType });
            }

            for (const { id, score } of semanticBookIds) {
                const existing = bookScoreMap.get(id);
                if (!existing) {
                    bookScoreMap.set(id, { score, matchType: 'semantic' });
                } else if (score > existing.score) {
                    bookScoreMap.set(id, { score, matchType: 'semantic' });
                }
            }

            // Merge description keyword results
            for (const { id, score } of descriptionBookIds) {
                const existing = bookScoreMap.get(id);
                if (!existing) {
                    bookScoreMap.set(id, { score, matchType: 'description_keyword' });
                } else if (score > existing.score) {
                    bookScoreMap.set(id, { score, matchType: 'description_keyword' });
                }
            }

            let bookIds = Array.from(bookScoreMap.keys());
            this.logger.log(`📊 Found ${bookIds.length} unique books from search`);

            if (bookIds.length === 0) {
                return this.emptyResult(page, limit);
            }

            // STEP 2: Build filter query
            const filterQuery: any = {
                _id: { $in: bookIds.map(id => new Types.ObjectId(id)) },
                isDeleted: false,
                status: 'published',
            };

            // Filter by genres
            if (genres) {
                const genreSlugs = genres.split(',').map(g => g.trim());
                const genreDocs = await this.genreModel.find({ slug: { $in: genreSlugs } }).select('_id');
                const genreIds = genreDocs.map(doc => doc._id);

                if (genreIds.length > 0) {
                    filterQuery.genres = { $in: genreIds };
                } else {
                    return this.emptyResult(page, limit);
                }
            }

            // Filter by author
            if (author && Types.ObjectId.isValid(author)) {
                filterQuery.authorId = new Types.ObjectId(author);
            }

            // Filter by tags
            if (tags) {
                const tagsList = tags.split(',').map(t => t.trim());
                filterQuery.tags = { $in: tagsList };
            }

            // STEP 3: Fetch books with full data
            const totalCount = await this.bookModel.countDocuments(filterQuery);

            // Get books with populated data
            let books = await this.bookModel
                .find(filterQuery)
                .populate('authorId', 'name avatar')
                .populate('genres', 'name slug')
                .lean();

            // STEP 4: Add stats to each book
            const booksWithStats = await this.enrichBooksWithStats(books, bookScoreMap);

            // STEP 5: Sort and paginate
            const sortedBooks = this.sortBooks(booksWithStats, sortBy, order);
            const skip = (page - 1) * limit;
            const paginatedBooks = sortedBooks.slice(skip, skip + limit);

            return {
                data: paginatedBooks,
                metaData: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };

        } catch (error) {
            this.logger.error(`❌ Search error: ${error.message}`, error.stack);
            throw error;
        }
    }

    /** FUZZY SEARCH - Search by title, slug, and author name */
    private async fuzzySearchBookIds(query: string): Promise<Array<{ id: string; score: number; matchType: string }>> {
        const results: Array<{ id: string; score: number; matchType: string }> = [];
        const normalizedQuery = this.normalizeText(query);

        if (normalizedQuery.length < 2) return results;

        const originalWords = query.trim().split(/\s+/).filter(w => w.length > 1);
        if (originalWords.length > 6) return results;

        try {
            const requiredWords = originalWords.slice(0, Math.ceil(originalWords.length * 0.7));
            const regexPattern = originalWords.length <= 3
                ? originalWords.join('.*')
                : requiredWords.join('|');

            const regex = new RegExp(regexPattern, 'i');

            // Search books by title and slug
            const books = await this.bookModel
                .find({
                    $or: [
                        { title: { $regex: regex } },
                        { slug: { $regex: regex } },
                    ],
                    status: 'published',
                    isDeleted: false,
                })
                .select('_id title slug')
                .limit(30)
                .lean();

            for (const book of books) {
                const titleSimilarity = this.calculateTextSimilarity(query, book.title);
                const slugSimilarity = this.calculateTextSimilarity(query, book.slug || '');
                const similarity = Math.max(titleSimilarity, slugSimilarity);

                if (similarity >= 0.6) {
                    let score = similarity >= 1.0 ? 15.0 : similarity >= 0.8 ? 12.0 : 10.0;
                    results.push({
                        id: book._id.toString(),
                        score,
                        matchType: similarity >= 1.0 ? 'exact' : similarity >= 0.8 ? 'starts_with' : 'contains',
                    });
                }
            }

            // Search authors and get their books
            const authors = await this.authorModel
                .find({ name: { $regex: regex } })
                .select('_id name')
                .limit(10)
                .lean();

            for (const author of authors) {
                const similarity = this.calculateTextSimilarity(query, author.name);

                if (similarity >= 0.6) {
                    const authorBooks = await this.bookModel
                        .find({ authorId: author._id, status: 'published', isDeleted: false })
                        .select('_id')
                        .limit(15)
                        .lean();

                    let score = similarity >= 1.0 ? 15.0 : similarity >= 0.8 ? 12.0 : 10.0;

                    for (const book of authorBooks) {
                        const bookId = book._id.toString();
                        const existingIndex = results.findIndex(r => r.id === bookId);

                        if (existingIndex === -1) {
                            results.push({
                                id: bookId,
                                score: score * 0.9,
                                matchType: 'author_match',
                            });
                        }
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
     * SEMANTIC SEARCH - Return Book IDs with Scores
     * ============================================
     */
    private async semanticSearchBookIds(query: string): Promise<Array<{ id: string; score: number }>> {
        const results: Array<{ id: string; score: number }> = [];

        try {
            const vectorStore = this.chromaService.getVectorStore();
            const rawResults = await vectorStore.similaritySearchWithScore(query, 30);

            const bookScores = new Map<string, number>();

            for (const [doc, distance] of rawResults) {
                const { type, bookId } = doc.metadata;
                const score = 1 / (1 + distance);

                if (type !== 'book' || !bookId) continue;

                if (!bookScores.has(bookId) || bookScores.get(bookId)! < score) {
                    bookScores.set(bookId, score);
                }
            }

            for (const [id, score] of bookScores) {
                if (score >= 0.5) {
                    results.push({ id, score });
                }
            }

        } catch (error) {
            this.logger.error(`❌ Semantic search error: ${error.message}`);
        }

        return results;
    }

    /** DESCRIPTION KEYWORD SEARCH - Search keywords in book descriptions */
    private async descriptionKeywordSearch(query: string): Promise<Array<{ id: string; score: number }>> {
        const results: Array<{ id: string; score: number }> = [];

        try {
            // Extract significant words from query
            // - At least 4 chars for common words
            // - At least 3 chars for capitalized words (proper nouns like "Ron", "Harry")
            const words = query
                .trim()
                .split(/\s+/)
                .filter(w => {
                    if (this.isStopWord(w)) return false;
                    // Keep proper nouns (capitalized) with 3+ chars
                    if (w[0] === w[0].toUpperCase() && w.length >= 3) return true;
                    // Keep common words with 4+ chars
                    return w.length >= 4;
                });

            if (words.length === 0) return results;

            // Build regex pattern with word boundaries
            const regexPattern = words.map(w => `\\b${w}\\b`).join('|');
            const regex = new RegExp(regexPattern, 'i');

            // Search in description field
            const books = await this.bookModel
                .find({
                    description: { $regex: regex },
                    status: 'published',
                    isDeleted: false,
                })
                .select('_id title description')
                .limit(10)
                .lean();

            for (const book of books) {
                const description = book.description?.toLowerCase() || '';

                // Calculate score based on how many words match
                const matchedWords = words.filter(word =>
                    description.includes(word.toLowerCase())
                );

                if (matchedWords.length > 0) {
                    // Count proper nouns matched
                    const properNounMatches = matchedWords.filter(w => w[0] === w[0].toUpperCase());

                    // Count frequency of matches (how many times keywords appear)
                    let frequencyBonus = 0;
                    for (const word of matchedWords) {
                        const count = (description.match(new RegExp(word.toLowerCase(), 'gi')) || []).length;
                        frequencyBonus += (count - 1) * 0.2; // +0.2 for each additional occurrence
                    }

                    // Base score: 8.0
                    // +2.0 per proper noun match (boosted from 1.0)
                    // +0.5 per common word match
                    // +1.0 bonus if matching multiple proper nouns (like "Ron Weasley")
                    const multipleProperNounBonus = properNounMatches.length >= 2 ? 1.0 : 0;
                    const score = 8.0
                        + (properNounMatches.length * 2.0)
                        + ((matchedWords.length - properNounMatches.length) * 0.5)
                        + multipleProperNounBonus
                        + Math.min(frequencyBonus, 2.0); // Cap frequency bonus at 2.0

                    results.push({ id: book._id.toString(), score });
                }
            }
        } catch (error) {
            this.logger.error(`❌ Description keyword search error: ${error.message}`);
        }

        return results;
    }

    /** Check if a word is a stop word */
    private isStopWord(word: string): boolean {
        const stopWords = [
            // Vietnamese common words
            'của', 'và', 'là', 'có', 'một', 'với', 'này', 'đó', 'được', 'cho',
            'trong', 'về', 'từ', 'như', 'không', 'những', 'các', 'khi', 'để', 'theo',
            'cậu', 'bé', 'người', 'bạn', 'tên', 'kết', 'thân', 'nhau', 'rồi', 'thì',
            'mà', 'nên', 'vì', 'còn', 'đã', 'sẽ', 'đang', 'cũng', 'rất', 'lại',
            'ra', 'vào', 'lên', 'xuống', 'đi', 'đến', 'tới', 'chỉ', 'thôi', 'nữa',
            'hay', 'hoặc', 'nhưng', 'tuy', 'nếu', 'thế', 'sao', 'gì', 'nào', 'đâu',
            // English common words
            'the', 'and', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'for',
            'with', 'this', 'that', 'from', 'but', 'not', 'all', 'can', 'will', 'just'
        ];
        return stopWords.includes(word.toLowerCase());
    }

    /** ENRICH BOOKS WITH STATS */
    private async enrichBooksWithStats(
        books: any[],
        scoreMap: Map<string, { score: number; matchType: string }>
    ): Promise<SearchResultBook[]> {
        const bookIds = books.map(b => b._id);

        // Get chapter counts
        const chapterCounts = await this.chapterModel.aggregate([
            { $match: { bookId: { $in: bookIds } } },
            { $group: { _id: '$bookId', count: { $sum: 1 } } }
        ]);
        const chapterMap = new Map(chapterCounts.map(c => [c._id.toString(), c.count]));

        // Get review stats
        const reviewStats = await this.reviewModel.aggregate([
            { $match: { bookId: { $in: bookIds } } },
            {
                $group: {
                    _id: '$bookId',
                    avgRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);
        const reviewMap = new Map(reviewStats.map(r => [
            r._id.toString(),
            { rating: Math.round((r.avgRating || 0) * 10) / 10, reviews: r.reviewCount }
        ]));

        return books.map(book => {
            const bookId = book._id.toString();
            const scoreData = scoreMap.get(bookId) || { score: 0, matchType: 'unknown' };
            const reviewData = reviewMap.get(bookId) || { rating: 0, reviews: 0 };

            return {
                id: bookId,
                _id: bookId,
                title: book.title,
                slug: book.slug,
                description: book.description,
                coverUrl: book.coverUrl,
                status: book.status,
                tags: book.tags,
                views: book.views || 0,
                likes: book.likes || 0,
                createdAt: book.createdAt,
                updatedAt: book.updatedAt,
                authorId: book.authorId ? {
                    _id: book.authorId._id?.toString() || '',
                    name: book.authorId.name || 'Unknown',
                    avatar: book.authorId.avatar,
                } : { _id: '', name: 'Unknown', avatar: undefined },
                genres: (book.genres || []).map((g: any) => ({
                    _id: g._id?.toString() || '',
                    name: g.name,
                    slug: g.slug,
                })),
                stats: {
                    chapters: chapterMap.get(bookId) || 0,
                    views: book.views || 0,
                    likes: book.likes || 0,
                    rating: reviewData.rating,
                    reviews: reviewData.reviews,
                },
                score: scoreData.score,
                matchType: scoreData.matchType,
            };
        });
    }

    /** SORT BOOKS */
    private sortBooks(books: SearchResultBook[], sortBy: string, order: string): SearchResultBook[] {
        const multiplier = order === 'asc' ? 1 : -1;

        return [...books].sort((a, b) => {
            switch (sortBy) {
                case 'views':
                    return (a.views - b.views) * multiplier;
                case 'likes':
                    return (a.likes - b.likes) * multiplier;
                case 'rating':
                    return (a.stats.rating - b.stats.rating) * multiplier;
                case 'popular':
                    return (a.stats.reviews - b.stats.reviews) * multiplier;
                case 'createdAt':
                    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * multiplier;
                case 'updatedAt':
                    return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * multiplier;
                case 'score':
                default:
                    return (a.score - b.score) * multiplier;
            }
        });
    }

    /** Empty result helper */
    private emptyResult(page: number, limit: number): PaginatedSearchResult {
        return {
            data: [],
            metaData: { page, limit, total: 0, totalPages: 0 },
        };
    }

    /** Normalize text for comparison */
    private normalizeText(text: string): string {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    /** Calculate text similarity */
    private calculateTextSimilarity(query: string, targetText: string): number {
        if (!query || !targetText) return 0.0;

        const normalizedQuery = this.normalizeText(query);
        const normalizedTarget = this.normalizeText(targetText);

        if (normalizedTarget === normalizedQuery) {
            return 1.0;
        } else if (normalizedTarget.startsWith(normalizedQuery)) {
            return 0.8;
        } else if (normalizedTarget.includes(normalizedQuery)) {
            return 0.6;
        }
        return 0.0;
    }
}
