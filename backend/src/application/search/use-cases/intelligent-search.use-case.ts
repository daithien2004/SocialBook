import { getErrorMessage } from '@/common/utils/error.util';
import { calculateFuzzyScore } from '@/common/utils/string.util';
import { Injectable, Logger } from '@nestjs/common';
import { IntelligentSearchQuery } from './intelligent-search.query';
import {
  PaginatedSearchResult,
  SearchResultBook,
} from '@/domain/search/interfaces/search-result.model';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { Author } from '@/domain/authors/entities/author.entity';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';
import {
  SearchQueryExpansionService,
  QueryAnalysis,
} from '../services/search-query-expansion.service';
import { SearchRankingService } from '../services/search-ranking.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

interface HybridScore {
  finalScore: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

@Injectable()
export class IntelligentSearchUseCase {
  private readonly logger = new Logger(IntelligentSearchUseCase.name);

  private static readonly SEMANTIC_WEIGHT = 1.0;
  private static readonly KEYWORD_WEIGHT = 0.7;
  private static readonly EXACT_MATCH_BONUS = 80;
  private static readonly MIN_FINAL_SCORE = 35;

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly genreRepository: IGenreRepository,
    private readonly authorRepository: IAuthorRepository,
    private readonly queryExpansionService: SearchQueryExpansionService,
    private readonly rankingService: SearchRankingService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async execute(
    queryDto: IntelligentSearchQuery,
  ): Promise<PaginatedSearchResult> {
    const start = performance.now();
    const { query, page = 1, limit = 10, genres, order = 'desc' } = queryDto;

    const normalizedQuery = query.toLowerCase().trim();
    const mode = queryDto.mode ?? 'hybrid';

    // 1. Kiểm tra cache trong Redis
    const cacheKey = `search:${mode}:${encodeURIComponent(normalizedQuery)}:page:${page}:limit:${limit}:genres:${genres?.join(',') || 'all'}:order:${order}`;

    try {
      const cachedResult = await this.redis.get(cacheKey);
      if (cachedResult) {
        this.logger.debug(`[Search Cache Hit] ${cacheKey}`);
        return JSON.parse(cachedResult) as PaginatedSearchResult;
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
        this.bookRepository.findByTitle(BookTitle.create(query)),
      ]);

      const exactAuthor = authors.find(
        (a) => a.name.toString().toLowerCase() === normalizedQuery,
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
      candidateIds = await this.bookRepository.findIdsByFilter({
        ids: candidateIds,
        genres: resolvedGenreIds,
        status: 'published',
      });

      const total = candidateIds.length;
      const sortedIds = this.sortCandidateIds(candidateIds, hybridMap, order);
      const pagedIds = sortedIds.slice((page - 1) * limit, page * limit);

      if (pagedIds.length === 0) return this.emptyResult(page, limit, total);

      const books = await this.bookRepository.findByIds(
        pagedIds.map((id) => BookId.create(id)),
      );
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
          current: page,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / (limit || 1)),
        },
      };

      // 4. Lưu cache vào Redis (TTL 24 giờ)
      this.redis
        .setex(cacheKey, 86400, JSON.stringify(resultToReturn))
        .catch((err) => {
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
    exactAuthor?: Author,
    exactBook?: Book,
  ): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    // 1. Tìm tác giả theo tên
    const authors = await this.authorRepository.searchByName(query, 5);
    const authorIds = authors.map((a) => a.id.toString());

    if (exactAuthor && !authorIds.includes(exactAuthor.id.toString())) {
      authorIds.push(exactAuthor.id.toString());
    }

    let allBooks: Array<{
      id: string;
      title: string;
      authorName?: string;
      description?: string;
    }> = [];

    // Tìm kiếm song song
    const [booksByTitle, booksByAuthor] = await Promise.all([
      this.bookRepository.findSearchCandidates(
        { search: query, status: 'published' },
        50,
      ),
      authorIds.length > 0
        ? this.bookRepository.findSearchCandidates(
            { authorIds: authorIds, status: 'published' },
            50,
          )
        : Promise.resolve([]),
    ]);

    allBooks = [...booksByTitle, ...booksByAuthor];

    if (exactBook && exactBook.status.toString() === 'published') {
      allBooks.push({
        id: exactBook.id.toString(),
        title: exactBook.title.toString(),
        authorName: exactBook.authorName || exactBook.author?.name,
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
      if (
        exactAuthor &&
        calculateFuzzyScore(exactAuthor.name.toString(), author) >= 90
      ) {
        score = Math.max(score, 100);
      }
      if (exactBook && bid === exactBook.id.toString()) {
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
          s.finalScore * 100 * IntelligentSearchUseCase.SEMANTIC_WEIGHT,
        matchType: 'semantic',
      });
    }

    const keywordWeight =
      mode === 'keyword' ? 1.0 : IntelligentSearchUseCase.KEYWORD_WEIGHT;

    for (const [id, kScore] of keyword) {
      const existing = hybridMap.get(id);
      const weightedKScore = kScore * keywordWeight;
      const bonus =
        kScore === 100 ? IntelligentSearchUseCase.EXACT_MATCH_BONUS : 0;

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

    // Bộ lọc sàn: Lập tức loại bỏ những sách có tổng điểm dưới 25 (điểm liệt)
    for (const [id, score] of hybridMap.entries()) {
      if (score.finalScore < IntelligentSearchUseCase.MIN_FINAL_SCORE) {
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
      return found.map((g) => g.id.toString());
    }
    const targetNames = analysis?.targetGenres ?? [];
    if (targetNames.length === 0) return [];
    const foundGenres = await this.genreRepository.findByNames(targetNames);
    return foundGenres.map((g) => g.id.toString());
  }

  private async enrichAndMap(
    books: Book[],
    scoreMap: Map<string, HybridScore>,
  ): Promise<SearchResultBook[]> {
    const foundIds = books.map((b) => b.id.toString());
    const [chapterCounts, reviewStats] = await Promise.all([
      this.chapterRepository.countChaptersForBooks(foundIds),
      this.reviewRepository.getStatsForBooks(foundIds),
    ]);

    return books.map((book) => {
      const bid = book.id.toString();
      const scoreData = scoreMap.get(bid);
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
          name: book.author?.name || book.authorName || 'Unknown',
          avatar: undefined,
        },
        genres:
          book.genreObjects?.map((g) => ({
            _id: g.id,
            name: g.name,
            slug: g.slug,
          })) || [],
        stats: {
          chapters: chapterCounts.get(bid) || 0,
          views: book.views,
          likes: book.likes,
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
  ): PaginatedSearchResult {
    const divisor = limit || 1;
    return {
      data: [],
      meta: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / divisor),
      },
    };
  }

  async recordSearch(keyword: string): Promise<void> {
    const cleanKeyword = keyword.trim().toLowerCase();
    if (cleanKeyword.length <= 2) return;

    const today = new Date().toISOString().slice(0, 10);
    const bucketKey = `trending:searches:${today}`;
    const TTL_SECONDS = 8 * 24 * 3600;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.zincrby(bucketKey, 1, cleanKeyword);
      pipeline.expire(bucketKey, TTL_SECONDS, 'NX');
      await pipeline.exec();
    } catch (err) {
      this.logger.error(
        `Failed to increment trending search for keyword: ${cleanKeyword}`,
        err,
      );
    }
  }
}
