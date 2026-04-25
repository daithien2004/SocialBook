import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IGeminiService } from '@/domain/gemini/services/gemini.service.interface';
import { INFRASTRUCTURE_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';

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
    @Inject(INFRASTRUCTURE_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) { }

  /**
   * Mở rộng câu query bằng Gemini (Chain-of-Thought).
   * Bắt buộc giữ thực thể gốc, không abstract hóa.
   * Kết quả được cache Redis 24h.
   */
  async expand(query: string): Promise<QueryAnalysis | null> {
    const cacheKey = `rag:expansion:${query.trim().toLowerCase()}`;

    const cached = await this.cacheService.get<QueryAnalysis>(cacheKey);
    if (cached) {
      this.logger.debug(`[RAG] Cache HIT: "${query}"`);
      return cached;
    }

    try {
      const prompt = `Bạn là chuyên gia tìm kiếm sách. Phân tích câu tìm kiếm theo từng bước.

CÂU NGƯỜI DÙNG: "${query}"

BƯỚC 1 — NHẬN DIỆN THỰC THỂ:
- Liệt kê: tên nhân vật, địa danh, vật thể, con vật, tổ chức trong câu.
- Các từ này BẮT BUỘC phải có trong expandedQuery.
- Sửa lỗi chính tả nếu có (VD: "Hogwart" → "Hogwarts", "Hermony" → "Hermione").

BƯỚC 2 — PHÂN TÍCH INTENT:
- Nếu câu có thực thể cụ thể → expandedQuery PHẢI bám sát, không dùng khái niệm trừu tượng thay thế.

BƯỚC 3 — MỞ RỘNG CÓ KIỂM SOÁT:
- Thêm tên tác phẩm/nhân vật nổi tiếng nếu nhận ra được.
- KHÔNG biến câu cụ thể thành câu trừu tượng.
- VD SAI: "bầy nhện trong rừng" → "đối mặt nỗi sợ hãi, đấu tranh nội tâm"
- VD ĐÚNG: "bầy nhện trong rừng" → "Harry Potter bầy nhện khổng lồ Rừng Cấm Hogwarts Aragog"

Trả về JSON (chỉ JSON):
{
  "expandedQuery": "chuỗi đã chuẩn hóa, bắt buộc chứa thực thể gốc",
  "targetGenres": ["thể loại nếu rõ ràng, bỏ trống nếu không chắc"],
  "themes": ["chủ đề cụ thể từ câu gốc"],
  "intent": "mô tả ngắn gọn người dùng muốn tìm gì"
}`;

      const result = await this.geminiService.generateJSON<QueryAnalysis>(prompt);
      if (result) {
        await this.cacheService.set(cacheKey, result, SearchQueryExpansionService.CACHE_TTL_SECONDS);
        this.logger.debug(`[RAG] Cache SET: "${query}"`);
      }
      return result;
    } catch (e) {
      this.logger.warn(`[RAG] Expansion failed: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }
}
