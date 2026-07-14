import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { ICacheService } from '@/domain/shared/interfaces/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/interfaces/cache.service.interface';

export interface QueryAnalysis {
  expandedQuery: string;
  targetGenres: string[];
  themes: string[];
  intent: string;
}

@Injectable()
export class SearchQueryExpansionService {
  private readonly logger = new Logger(SearchQueryExpansionService.name);
  private static readonly CACHE_TTL_SECONDS = 86400; // 24h

  constructor(
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  /**
   * Mở rộng câu query bằng Gemini (Chain-of-Thought).
   * Bắt buộc giữ thực thể gốc, không abstract hóa.
   * Kết quả được cache Redis 24h.
   */
  private isSimpleQuery(query: string): boolean {
    const trimmed = query.trim();
    if (trimmed.length <= 3) return true;
    const words = trimmed.split(/\s+/);
    if (words.length <= 2 && trimmed.length <= 40) return true;
    return false;
  }

  expand(query: string): Promise<QueryAnalysis | null> {
    // Đã tắt gọi Gemini LLM để giảm latency. Dùng thẳng câu query của user để embedding.
    this.logger.debug(`[RAG] Skipping Gemini expansion for speed: "${query}"`);
    return Promise.resolve({
      expandedQuery: query,
      targetGenres: [],
      themes: [],
      intent: 'direct_search',
    });
  }
}
