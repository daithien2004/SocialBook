import { Injectable, Logger, Inject } from '@nestjs/common';
import { SearchQuery as AppSearchQuery } from '@/domain/search/models/search-query.model';
import {
  PaginatedSearchResult,
  SearchResultBook,
} from '@/domain/search/models/search-result.model';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { GenreName } from '@/domain/genres/value-objects/genre-name.vo';
import { SearchQueryExpansionService, QueryAnalysis } from '../services/search-query-expansion.service';
import { SearchRankingService } from '../services/search-ranking.service';

interface BookScoreEntry {
  score: number;
  matchType: string;
}

@Injectable()
export class IntelligentSearchUseCase {
  private readonly logger = new Logger(IntelligentSearchUseCase.name);
  private static readonly KEYWORD_BASE_SCORE = 60;

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly genreRepository: IGenreRepository,
    private readonly queryExpansionService: SearchQueryExpansionService,
    private readonly rankingService: SearchRankingService,
  ) { }

  async execute(queryDto: AppSearchQuery): Promise<PaginatedSearchResult> {
    const { query, page = 1, limit = 10, genres, sortBy = 'score', order = 'desc' } = queryDto;

    // BƯỚC 1: RAG Query Expansion
    const analysis = await this.queryExpansionService.expand(query);
    const expandedQuery = analysis?.expandedQuery ?? query;
    const searchVector = `${query} ${expandedQuery}`;

    this.logger.log(`[Search] "${query}" → "${searchVector}"`);

    // BƯỚC 2: Semantic Search + Re-ranking
    const candidates = await this.rankingService.search(searchVector, query);
    const bookScoreMap = new Map<string, BookScoreEntry>(
      candidates.map((c) => [c.id, { score: c.finalScore * 100, matchType: 'semantic-rag' }]),
    );

    // BƯỚC 3: Keyword Fallback (Hybrid)
    await this.mergeKeywordResults(bookScoreMap, query);

    const candidateIds = Array.from(bookScoreMap.keys());
    if (candidateIds.length === 0) {
      return { data: [], meta: { current: page, pageSize: limit, total: 0, totalPages: 0 } };
    }

    // BƯỚC 4: Genre Filter
    const genreIds = await this.resolveGenreIds(genres, analysis);

    // BƯỚC 5: Fetch + Enrich + Map
    const booksResult = await this.bookRepository.findAll(
      { ids: candidateIds, genres: genreIds.length > 0 ? genreIds : undefined, status: 'published' },
      { page: 1, limit: 1000 },
    );
    const searchResults = await this.enrichAndMap(booksResult.data, bookScoreMap);

    // BƯỚC 6: Sort + Paginate
    const sorted = this.sortBooks(searchResults, sortBy === 'score' ? 'score' : sortBy, order);
    const startIndex = (page - 1) * limit;

    return {
      data: sorted.slice(startIndex, startIndex + limit),
      meta: { current: page, pageSize: limit, total: sorted.length, totalPages: Math.ceil(sorted.length / limit) },
    };
  }

  private async mergeKeywordResults(
    bookScoreMap: Map<string, BookScoreEntry>,
    query: string,
  ): Promise<void> {
    const { data } = await this.bookRepository.findAll(
      { title: query, status: 'published' },
      { page: 1, limit: 20 },
    );
    for (let i = 0; i < data.length; i++) {
      const bid = data[i].id.toString();
      const keywordScore = IntelligentSearchUseCase.KEYWORD_BASE_SCORE - i;
      const existing = bookScoreMap.get(bid);
      if (!existing || keywordScore > existing.score) {
        bookScoreMap.set(bid, { score: keywordScore, matchType: existing ? 'hybrid' : 'keyword' });
      }
    }
  }

  private async resolveGenreIds(
    genres: string | undefined,
    analysis: QueryAnalysis | null,
  ): Promise<string[]> {
    if (genres) {
      const found = await this.genreRepository.findBySlugs(genres.split(','));
      return found.map((g) => g.id.toString());
    }
    const genreIds: string[] = [];
    for (const gName of analysis?.targetGenres ?? []) {
      try {
        const g = await this.genreRepository.findByName(GenreName.create(gName));
        if (g) genreIds.push(g.id.toString());
      } catch {
        this.logger.debug(`Genre not found: ${gName}`);
      }
    }
    return genreIds;
  }

  private async enrichAndMap(
    books: Array<{
      id: { toString(): string };
      title: { toString(): string };
      slug: string;
      description: string;
      coverUrl: string;
      status: { toString(): string };
      tags: string[];
      views: number;
      likes: number;
      createdAt: Date;
      updatedAt: Date;
      authorId: { toString(): string };
      author?: { name: string };
      genreObjects?: Array<{ id: string; name: string; slug: string }>;
    }>,
    bookScoreMap: Map<string, BookScoreEntry>,
  ): Promise<SearchResultBook[]> {
    const foundIds = books.map((b) => b.id.toString());
    const [chapterCounts, reviewStats] = await Promise.all([
      this.chapterRepository.countChaptersForBooks(foundIds),
      this.reviewRepository.getStatsForBooks(foundIds),
    ]);

    return books.map((book) => {
      const bid = book.id.toString();
      const scoreData = bookScoreMap.get(bid);
      const rStats = reviewStats.get(bid) || { rating: 0, count: 0 };
      return {
        id: bid, _id: bid,
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
        authorId: { _id: book.authorId.toString(), name: book.author?.name || 'Unknown', avatar: undefined },
        genres: book.genreObjects?.map((g) => ({ _id: g.id, name: g.name, slug: g.slug })) || [],
        stats: {
          chapters: chapterCounts.get(bid) || 0,
          views: book.views,
          likes: book.likes,
          rating: rStats.rating,
          reviews: rStats.count,
        },
        score: scoreData?.score ?? 0,
        matchType: scoreData?.matchType,
      };
    });
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
