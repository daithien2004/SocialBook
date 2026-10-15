import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { calculateFuzzyScore } from './fuzzy-search.util';
import { Logger } from '@nestjs/common';
import { IntelligentSearchQuery } from './intelligent-search.query';
import {
  PaginatedSearchBookResult,
  SearchBookResult,
} from '../../dto/search-book-result.dto';
import {
  BookSearchReadRepository,
  type BookSearchReadModel,
} from '@/modules/books';
import type { BookListReadModel } from '@/modules/books';
import { IChapterReadRepository } from '@/modules/chapters';
import { IReviewRepository } from '@/modules/reviews/domain/public-api';
import { GenreReadRepository } from '@/modules/genres';
import {
  AuthorReadRepository,
  type AuthorSearchReadModel,
} from '@/modules/authors';
import {
  SearchQueryExpansionService,
  QueryAnalysis,
} from '../../services/search-query-expansion.service';
import { SearchRankingService } from '../../services/search-ranking.service';
import { ICachePort } from '@/shared/domain/cache.port';
import { ForbiddenError } from '@casl/ability';

interface HybridScore {
  finalScore: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

@QueryHandler(IntelligentSearchQuery)
export class IntelligentSearchHandler implements IQueryHandler<IntelligentSearchQuery> {
  private readonly logger = new Logger(IntelligentSearchHandler.name);

  private static readonly SEMANTIC_WEIGHT = 1.0;
  private static readonly KEYWORD_WEIGHT = 0.7;
  private static readonly EXACT_MATCH_BONUS = 80;
  private static readonly MIN_FINAL_SCORE = 35;

  constructor(
    private readonly bookSearchRepository: BookSearchReadRepository,
    private readonly chapterRepository: IChapterReadRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly genreRepository: GenreReadRepository,
    private readonly authorRepository: AuthorReadRepository,
    private readonly queryExpansionService: SearchQueryExpansionService,
    private readonly rankingService: SearchRankingService,
    private readonly cacheService: ICachePort,
  ) {}

  async execute(
    queryDto: IntelligentSearchQuery,
  ): Promise<PaginatedSearchBookResult> {
    ForbiddenError.from(queryDto.actor.ability).throwUnlessCan(
      'read',
      'Search',
    );
    const start = performance.now();
    const { query, page = 1, limit = 10, genres, order = 'desc' } = queryDto;

    const normalizedQuery = query.toLowerCase().trim();
    const mode = queryDto.mode ?? 'hybrid';

    // 1. Kiểm tra cache trong Redis
    const cacheKey = `search:${mode}:${encodeURIComponent(normalizedQuery)}:page:${page}:limit:${limit}:genres:${genres?.join(',') || 'all'}:order:${order}`;

    try {
      const cachedResult =
        await this.cacheService.get<PaginatedSearchBookResult>(cacheKey);
      if (cachedResult) {
        this.logger.debug(`[Search Cache Hit] ${cacheKey}`);
        return cachedResult;
      }
    } catch (err) {
      this.logger.warn(
        `Failed to get search cache from Redis for key: ${cacheKey}`,
        err,
      );
    }

    try {
      // 1. KIỂM TRA TÁC GIẢ & TÊN SÁCH (Local DB)
      const [authors, exactBook] = await Promise.all([
        this.authorRepository.searchByName(query, 1),
        this.bookSearchRepository.findByTitle(query),
      ]);

      const exactAuthor = authors.find(
        (author) => author.name.toLowerCase() === normalizedQuery,
      );

      // 2. Chạy tìm kiếm tuỳ theo mode
      let keywordPromise: Promise<Map<string, number>> = Promise.resolve(
        new Map<string, number>(),
      );
      let semanticPromise: Promise<{
        analysis: QueryAnalysis | null;
        semanticResults: Array<{ id: string; finalScore: number }>;
      }> = Promise.resolve({ analysis: null, semanticResults: [] });

      if (mode === 'keyword' || mode === 'hybrid') {
        keywordPromise = this.getKeywordCandidates(
          query,
          exactAuthor,
          exactBook ?? undefined,
        );
      }

      if (mode === 'semantic' || mode === 'hybrid') {
        semanticPromise = this.queryExpansionService
          .expand(query)
          .then(async (res) => {
            const expandedQuery = res?.expandedQuery ?? query;
            const sRes = await this.rankingService.search(expandedQuery, query);
            return { analysis: res, semanticResults: sRes };
          });
      }

      const [keywordResults, { analysis, semanticResults }] = await Promise.all(
        [keywordPromise, semanticPromise],
      );

      const hybridMap = this.calculateHybridScores(
        semanticResults,
        keywordResults,
        mode,
      );

      let candidateIds = Array.from(hybridMap.keys());
      if (candidateIds.length === 0) return this.emptyResult(page, limit);

      // 3. Genre Resolution
      let resolvedGenreIds: string[] | undefined = undefined;
      if (genres || analysis?.targetGenres?.length) {
        resolvedGenreIds = await this.resolveGenreIds(genres, analysis);
      }

      // 4. MÀN LỌC QUYẾT ĐỊNH (Luôn chạy để đảm bảo total khớp với thực tế DB)
      candidateIds = await this.bookSearchRepository.findIdsByFilter({
        ids: candidateIds,
        genres: resolvedGenreIds,
        status: 'published',
      });

      const total = candidateIds.length;
      const sortedIds = this.sortCandidateIds(candidateIds, hybridMap, order);
      const pagedIds = sortedIds.slice((page - 1) * limit, page * limit);

      if (pagedIds.length === 0) return this.emptyResult(page, limit, total);

      const books = await this.bookSearchRepository.findByIds(pagedIds);
      const searchResults = await this.enrichAndMap(books, hybridMap);

      const finalResult = searchResults.sort(
        (a, b) => (b.score - a.score) * (order === 'desc' ? 1 : -1),
      );

      const end = performance.now();
      this.logger.debug(
        `[IntelligentSearch] "${query}" -> ${total} results in ${Math.round(end - start)}ms`,
      );

      const resultToReturn = {
        data: finalResult,
        meta: {
          page,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / (limit || 1)),
        },
      };

      // 4. Lưu cache vÃ o Redis (TTL 24 giờ)
      this.cacheService.set(cacheKey, resultToReturn, 86400).catch((err) => {
        this.logger.warn(
          `Failed to set search cache to Redis for key: ${cacheKey}`,
          err,
        );
      });

      return resultToReturn;
    } catch (e: unknown) {
      this.logger.error(`Search process failed: ${getErrorMessage(e)}`);
      throw e;
    }
  }

  private async getKeywordCandidates(
    query: string,
    exactAuthor?: AuthorSearchReadModel,
    exactBook?: BookSearchReadModel,
  ): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    // 1. Tìm tác giả theo tên
    const authors = await this.authorRepository.searchByName(query, 5);
    const authorIds = authors.map((author) => author.id);

    if (exactAuthor && !authorIds.includes(exactAuthor.id)) {
      authorIds.push(exactAuthor.id);
    }

    let allBooks: Array<{
      id: string;
      title: string;
      authorName?: string;
      description?: string;
    }> = [];

    // Tìm kiếm song song
    const [booksByTitle, booksByAuthor] = await Promise.all([
      this.bookSearchRepository.findSearchCandidates(
        { search: query, status: 'published' },
        50,
      ),
      authorIds.length > 0
        ? this.bookSearchRepository.findSearchCandidates(
            { authorIds: authorIds, status: 'published' },
            50,
          )
        : Promise.resolve([]),
    ]);

    allBooks = [...booksByTitle, ...booksByAuthor];

    if (exactBook && exactBook.status === 'published') {
      allBooks.push({
        id: exactBook.id,
        title: exactBook.title,
        authorName: exactBook.authorName,
        description: exactBook.description,
      });
    }

    allBooks.forEach((book) => {
      const bid = book.id;
      if (results.has(bid)) return;

      const title = book.title || '';
      const author = book.authorName || '';

      let score = Math.max(
        calculateFuzzyScore(query, title),
        calculateFuzzyScore(query, author),
      );

      // Nếu search trúng đích danh tác giả hoặc đích danh sách, cộng kịch trần
      if (exactAuthor && calculateFuzzyScore(exactAuthor.name, author) >= 90) {
        score = Math.max(score, 100);
      }
      if (exactBook && bid === exactBook.id) {
        score = 100;
      }

      if (score > 0) {
        results.set(bid, score);
      }
    });

    return results;
  }

  private calculateHybridScores(
    semantic: Array<{ id: string; finalScore: number }>,
    keyword: Map<string, number>,
    mode: 'keyword' | 'semantic' | 'hybrid',
  ): Map<string, HybridScore> {
    const hybridMap = new Map<string, HybridScore>();

    for (const s of semantic) {
      hybridMap.set(s.id, {
        finalScore:
          s.finalScore * 100 * IntelligentSearchHandler.SEMANTIC_WEIGHT,
        matchType: 'semantic',
      });
    }

    const keywordWeight =
      mode === 'keyword' ? 1.0 : IntelligentSearchHandler.KEYWORD_WEIGHT;

    for (const [id, kScore] of keyword) {
      const existing = hybridMap.get(id);
      const weightedKScore = kScore * keywordWeight;
      const bonus =
        kScore === 100 ? IntelligentSearchHandler.EXACT_MATCH_BONUS : 0;

      if (existing) {
        existing.finalScore += weightedKScore + bonus;
        existing.matchType = 'hybrid';
      } else {
        hybridMap.set(id, {
          finalScore: weightedKScore + bonus,
          matchType: 'keyword',
        });
      }
    }

    // Bộ lọc sÃ n: Lập tức loại bỏ những sách có tổng điểm dưới 25 (điểm liệt)
    for (const [id, score] of hybridMap.entries()) {
      if (score.finalScore < IntelligentSearchHandler.MIN_FINAL_SCORE) {
        hybridMap.delete(id);
      }
    }

    return hybridMap;
  }

  private sortCandidateIds(
    ids: string[],
    scoreMap: Map<string, HybridScore>,
    order: string,
  ): string[] {
    const mul = order === 'desc' ? 1 : -1;
    return [...ids].sort((a, b) => {
      const scoreA = scoreMap.get(a)?.finalScore ?? 0;
      const scoreB = scoreMap.get(b)?.finalScore ?? 0;
      return (scoreB - scoreA) * mul;
    });
  }

  private async resolveGenreIds(
    genres: string[] | undefined,
    analysis: QueryAnalysis | null,
  ): Promise<string[]> {
    if (genres && genres.length > 0) {
      const found = await this.genreRepository.findBySlugs(genres);
      return found.map((genre) => genre.id);
    }
    const targetNames = analysis?.targetGenres ?? [];
    if (targetNames.length === 0) return [];
    const foundGenres = await this.genreRepository.findByNames(targetNames);
    return foundGenres.map((genre) => genre.id);
  }

  private async enrichAndMap(
    books: BookListReadModel[],
    scoreMap: Map<string, HybridScore>,
  ): Promise<SearchBookResult[]> {
    const foundIds = books.map((book) => book.id);
    const [chapterCounts, reviewStats] = await Promise.all([
      this.chapterRepository.countChaptersForBooks(foundIds),
      this.reviewRepository.getStatsForBooks(foundIds),
    ]);

    return books.map((book) => {
      const bid = book.id;
      const scoreData = scoreMap.get(bid);
      const rStats = reviewStats.get(bid) || { rating: 0, count: 0 };

      return {
        id: bid,
        title: book.title,
        slug: book.slug,
        description: book.description,
        coverUrl: book.coverUrl,
        status: book.status,
        tags: book.tags,
        views: book.stats.views,
        likes: book.stats.likes,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        authorId: {
          id: book.authorId,
          name: book.authorName || 'Unknown',
          avatar: undefined,
        },
        genres: book.genres.map((genre) => ({
          id: genre.id,
          name: genre.name,
          slug: genre.slug,
        })),
        stats: {
          chapters: chapterCounts.get(bid) || 0,
          views: book.stats.views,
          likes: book.stats.likes,
          rating: rStats.rating,
          reviews: rStats.count,
        },
        score: scoreData?.finalScore ?? 0,
        matchType: scoreData?.matchType,
      };
    });
  }

  private emptyResult(
    page: number,
    limit: number,
    total = 0,
  ): PaginatedSearchBookResult {
    const divisor = limit || 1;
    return {
      data: [],
      meta: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / divisor),
      },
    };
  }
}
