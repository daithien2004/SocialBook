import { Injectable, Logger } from '@nestjs/common';
import { SearchQuery as AppSearchQuery } from '@/domain/search/models/search-query.model';
import {
  PaginatedSearchResult,
  SearchResultBook,
} from '@/domain/search/models/search-result.model';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { GenreName } from '@/domain/genres/value-objects/genre-name.vo';
import { AuthorId } from '@/domain/authors/value-objects/author-id.vo';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { SearchQueryExpansionService, QueryAnalysis } from '../services/search-query-expansion.service';
import { SearchRankingService } from '../services/search-ranking.service';

interface HybridScore {
  finalScore: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

@Injectable()
export class IntelligentSearchUseCase {
  private readonly logger = new Logger(IntelligentSearchUseCase.name);

  private static readonly SEMANTIC_WEIGHT = 1.0;
  private static readonly KEYWORD_WEIGHT = 0.4;
  private static readonly EXACT_MATCH_BONUS = 50; 
  private static readonly MIN_FINAL_SCORE = 65;

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly genreRepository: IGenreRepository,
    private readonly authorRepository: IAuthorRepository,
    private readonly queryExpansionService: SearchQueryExpansionService,
    private readonly rankingService: SearchRankingService,
  ) { }

  async execute(queryDto: AppSearchQuery): Promise<PaginatedSearchResult> {
    const start = performance.now();
    const { query, page = 1, limit = 10, genres, sortBy = 'score', order = 'desc' } = queryDto;

    try {
      // Kích hoạt CẢ 3 hệ thống TÌM KIẾM SONG SONG cùng lúc để tối đa hóa tốc độ!
      const keywordPromise = this.getKeywordCandidates(query);
      const expandPromise = this.queryExpansionService.expand(query);
      // Đưa trực tiếp câu lệnh vào Vector Search để HuggingFace tự xử lý ngữ nghĩa, 
      const semanticPromise = this.rankingService.search(query, query);

      const [keywordResults, analysis, semanticResults] = await Promise.all([
        keywordPromise,
        expandPromise,
        semanticPromise
      ]);

      const hybridMap = this.calculateHybridScores(semanticResults, keywordResults);
      
      let candidateIds = Array.from(hybridMap.keys());
      if (candidateIds.length === 0) return this.emptyResult(page, limit);

      // 1. Genre Resolution 
      let resolvedGenreIds: string[] | undefined = undefined;
      if (genres || analysis?.targetGenres?.length) {
        resolvedGenreIds = await this.resolveGenreIds(genres, analysis);
      }

      // 2. MÀN LỌC QUYẾT ĐỊNH (Luôn chạy để đảm bảo total khớp với thực tế DB)
      candidateIds = await this.bookRepository.findIdsByFilter({ 
        ids: candidateIds, 
        genres: resolvedGenreIds, 
        status: 'published' 
      });

      const total = candidateIds.length;
      const sortedIds = this.sortCandidateIds(candidateIds, hybridMap, order);
      const pagedIds = sortedIds.slice((page - 1) * limit, page * limit);

      if (pagedIds.length === 0) return this.emptyResult(page, limit, total);

      const books = await this.bookRepository.findByIds(pagedIds.map(id => BookId.create(id)));
      const searchResults = await this.enrichAndMap(books, hybridMap);

      const finalResult = searchResults.sort((a, b) => (b.score - a.score) * (order === 'desc' ? 1 : -1));

      const end = performance.now();
      this.logger.debug(`[IntelligentSearch] "${query}" -> ${total} results in ${Math.round(end - start)}ms`);

      return {
        data: finalResult,
        meta: {
          current: page,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / (limit || 1)),
        },
      };

    } catch (e) {
      this.logger.error(`Search process failed: ${e.message}`);
      throw e;
    }
  }

  private async getKeywordCandidates(query: string): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    const normalizedQuery = query.toLowerCase().trim();

    // 1. Tìm tác giả theo tên
    const authors = await this.authorRepository.searchByName(query, 10);
    const authorIds = authors.map((a) => a.id.toString());

    // 2. Tìm sách theo Title VÀ Sách của các Tác giả vừa tìm được
    const [booksByTitle, booksByAuthor] = await Promise.all([
      this.bookRepository.findAll({ search: query, status: 'published' }, { page: 1, limit: 100 }), 
      authorIds.length > 0
        ? this.bookRepository.findAll({ authorIds: authorIds, status: 'published' }, { page: 1, limit: 100 }) 
        : Promise.resolve({ data: [] as Book[] }),
    ]);

    const allBooks = [...booksByTitle.data, ...booksByAuthor.data];

    const stopWords = new Set(['có', 'là', 'và', 'của', 'những', 'người', 'trong', 'một', 'các', 'cho', 'với', 'này', 'được', 'đã', 'đang', 'không', 'thì', 'cũng', 'như', 'khi', 'đến', 'từ', 'hay', 'nhưng', 'rất', 'nên', 'bạn', 'thân', 'nào', 'còn', 'tôi', 'anh']);
    const significantTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));

    allBooks.forEach((book) => {
      const bid = book.id.toString();
      if (results.has(bid)) return; // Tránh trùng lặp

      const title = book.title.toString().toLowerCase();
      const author = (book.authorName || '').toLowerCase();
      const desc = (book.description || '').toLowerCase();
      let score = 0;

      if (title === normalizedQuery || author === normalizedQuery) {
        score = 100;
      } else if (title.startsWith(normalizedQuery) || author.startsWith(normalizedQuery)) {
        score = 80;
      } else if (title.includes(normalizedQuery) || author.includes(normalizedQuery)) {
        score = 60;
      } else if (significantTokens.length > 0) {
        // Fallback: Tìm các từ khóa quan trọng (bỏ qua từ nối)
        const matchedTokens = significantTokens.filter(t => title.includes(t) || author.includes(t) || desc.includes(t));
        if (matchedTokens.length > 0) {
          // Tính điểm dựa trên tỷ lệ từ khóa khớp (20 - 40 điểm)
          score = 20 + (matchedTokens.length / significantTokens.length) * 20;
        }
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
  ): Map<string, HybridScore> {
    const hybridMap = new Map<string, HybridScore>();

    for (const s of semantic) {
      hybridMap.set(s.id, {
        finalScore: (s.finalScore * 100) * IntelligentSearchUseCase.SEMANTIC_WEIGHT,
        matchType: 'semantic',
      });
    }

    for (const [id, kScore] of keyword) {
      const existing = hybridMap.get(id);
      const weightedKScore = kScore * IntelligentSearchUseCase.KEYWORD_WEIGHT;
      const bonus = kScore === 100 ? IntelligentSearchUseCase.EXACT_MATCH_BONUS : 0;

      if (existing) {
        existing.finalScore += (weightedKScore + bonus);
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
    genres: string | undefined,
    analysis: QueryAnalysis | null,
  ): Promise<string[]> {
    if (genres) {
      const found = await this.genreRepository.findBySlugs(genres.split(','));
      return found.map((g) => g.id.toString());
    }
    const targetNames = analysis?.targetGenres ?? [];
    if (targetNames.length === 0) return [];
    const foundGenres = await this.genreRepository.findByNames(targetNames);
    return foundGenres.map(g => g.id.toString());
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
        authorId: { _id: book.authorId.toString(), name: book.author?.name || book.authorName || 'Unknown', avatar: undefined },
        genres: book.genreObjects?.map((g) => ({ _id: g.id, name: g.name, slug: g.slug })) || [],
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

  private emptyResult(page: number, limit: number, total = 0): PaginatedSearchResult {
    const divisor = limit || 1;
    return {
      data: [],
      meta: { current: page, pageSize: limit, total, totalPages: Math.ceil(total / divisor) },
    };
  }
}
