import { Injectable, Logger, Inject } from '@nestjs/common';
import { SearchQuery as AppSearchQuery } from '@/domain/search/models/search-query.model';
import { PaginatedSearchResult, SearchResultBook } from '@/domain/search/models/search-result.model';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { SearchQuery as VectorSearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { GeminiService } from '@/infrastructure/external/gemini.service';
import { INFRASTRUCTURE_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import { GenreName } from '@/domain/genres/value-objects/genre-name.vo';

@Injectable()
export class IntelligentSearchUseCase {
    private readonly logger = new Logger(IntelligentSearchUseCase.name);

    constructor(
        private readonly bookRepository: IBookRepository,
        private readonly authorRepository: IAuthorRepository,
        private readonly chapterRepository: IChapterRepository,
        private readonly reviewRepository: IReviewRepository,
        private readonly genreRepository: IGenreRepository,
        private readonly vectorRepository: IVectorRepository,
        @Inject(INFRASTRUCTURE_TOKENS.GEMINI_SERVICE)
        private readonly geminiService: GeminiService,
    ) {}

    async execute(queryDto: AppSearchQuery): Promise<PaginatedSearchResult> {
        try {
            const { query, page = 1, limit = 10, genres, sortBy = 'score', order = 'desc' } = queryDto;
            const q = query;
            
            // AI Analysis (Optional/Mocked for now)
            const aiAnalysis = await this.analyzeQueryWithAI(q);

            // STEP 1: Semantic Search (Candidate Generation)
            const semanticCandidates = await this.semanticSearch(q);
            
            const bookScoreMap = new Map<string, { score: number; matchType: string }>();
            semanticCandidates.forEach(c => bookScoreMap.set(c.id, { score: c.score * 50, matchType: 'semantic' }));

            // STEP 2 & 3: Keyword Search & Author Expansion (Simplified for now)
            // We can add author boosting if needed, but for now relying on semantic + filters.
            
            let candidateIds = Array.from(bookScoreMap.keys());
            if (candidateIds.length === 0) {
                 // Fallback to basic search if no semantic results?
                 // Or return empty.
                 // For now, return empty.
                 return { data: [], meta: { current: page, pageSize: limit, total: 0, totalPages: 0 } };
            }

            // STEP 4: Apply Filters (intersect with candidates)
            let genreIds: string[] = [];
            if (genres) {
                 const slugs = genres.split(',');
                 const genresFound = await this.genreRepository.findBySlugs(slugs);
                 genreIds = genresFound.map(g => g.id.toString());
            } else if (aiAnalysis?.targetGenres) {
                 for (const gName of aiAnalysis.targetGenres) {
                      try {
                          const gNameVO = GenreName.create(gName);
                          const g = await this.genreRepository.findByName(gNameVO);
                          if (g) genreIds.push(g.id.toString());
                      } catch (e) {}
                 }
            }

            // Fetch Full Book Data
            const booksResult = await this.bookRepository.findAll({
                ids: candidateIds,
                genres: genreIds.length > 0 ? genreIds : undefined,
                status: 'published'
            }, { 
                page: 1, 
                limit: 1000 
            });

            const books = booksResult.data;

            // STEP 5: Enrich with Stats (Batch)
            const foundIds = books.map(b => b.id.toString());
            const [chapterCounts, reviewStats] = await Promise.all([
                this.chapterRepository.countChaptersForBooks(foundIds),
                this.reviewRepository.getStatsForBooks(foundIds)
            ]);

            // Map to SearchResultBook
            const searchResults: SearchResultBook[] = books.map(book => {
                const bid = book.id.toString();
                const scoreData = bookScoreMap.get(bid);
                const rStats = reviewStats.get(bid) || { rating: 0, count: 0 };
                
                return {
                    id: bid,
                    _id: bid,
                    title: book.title.toString(),
                    slug: book.slug,
                    description: book.description,
                    coverUrl: book.coverUrl,
                    status: book.status.toString(),
                    tags: book.tags,
                    views: book.views,
                    likes: book.likes,
                    createdAt: book.createdAt,
                    updatedAt: book.updatedAt,
                    authorId: {
                        _id: book.authorId.toString(),
                        name: (book as any).author?.name || 'Unknown', 
                        avatar: (book as any).author?.avatar || undefined
                    },
                    genres: book.genres.map(g => ({
                        _id: g.toString(),
                        name: (g as any).name || 'Unknown', 
                        slug: (g as any).slug || ''
                    })),
                    stats: {
                        chapters: chapterCounts.get(bid) || 0,
                        views: book.views,
                        likes: book.likes,
                        rating: rStats.rating,
                        reviews: rStats.count
                    },
                    score: scoreData?.score || 0,
                    matchType: scoreData?.matchType,
                };
            });
            
            const finalSort = sortBy === 'score' ? 'score' : sortBy;
            const sorted = this.sortBooks(searchResults, finalSort, order);

            const startIndex = (page - 1) * limit;
            const sliced = sorted.slice(startIndex, startIndex + limit);

            return {
                data: sliced,
                meta: {
                    current: page,
                    pageSize: limit,
                    total: sorted.length,
                    totalPages: Math.ceil(sorted.length / limit)
                }
            };

        } catch (error) {
            this.logger.error(`Search execution failed: ${error.message}`);
            throw error;
        }
    }

    private async analyzeQueryWithAI(query: string): Promise<any> {
        return null; 
    }

    private async semanticSearch(query: string): Promise<Array<{ id: string; score: number }>> {
         try {
            const embedding = await this.geminiService.embedText(query);
            
            // Using VectorSearchQuery factory or constructor
            const searchQuery = VectorSearchQuery.create({
                query: query,
                embedding: embedding,
                limit: 30,
                threshold: 0.5
            });

            const results = await this.vectorRepository.search(searchQuery);

            return results
                .filter(r => r.document.metadata.type === 'book' || r.document.contentType.toString() === 'book')
                .map(r => ({
                    id: r.document.metadata.bookId || r.document.contentId, 
                    score: r.score
                }));
         } catch (e) {
             this.logger.warn(`Semantic search failed: ${e.message}`);
             return [];
         }
    }

    private sortBooks(books: SearchResultBook[], sortBy: string, order: string): SearchResultBook[] {
        const mul = order === 'asc' ? 1 : -1;
        return [...books].sort((a, b) => {
            switch (sortBy) {
                case 'views': return (a.views - b.views) * mul;
                case 'likes': return (a.likes - b.likes) * mul;
                case 'rating': return (a.stats.rating - b.stats.rating) * mul;
                case 'score': return (a.score - b.score) * mul;
                case 'createdAt': return (a.createdAt.getTime() - b.createdAt.getTime()) * mul;
                default: return 0;
            }
        });
    }
}

