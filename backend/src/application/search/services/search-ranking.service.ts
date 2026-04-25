import { Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { SearchQuery as VectorSearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

export interface RankedCandidate {
  id: string;
  score: number;
  relevanceScore: number;
  finalScore: number;
}

@Injectable()
export class SearchRankingService {
  private readonly logger = new Logger(SearchRankingService.name);

  private static readonly SEMANTIC_THRESHOLD = 0.5;
  private static readonly SEMANTIC_SEARCH_LIMIT = 50;
  private static readonly TITLE_KEYWORD_BOOST = 0.2;
  private static readonly CONTENT_KEYWORD_BOOST = 0.08;
  private static readonly TITLE_NGRAM_BOOST = 0.3;
  private static readonly CONTENT_NGRAM_BOOST = 0.15;

  /** Từ hư từ tiếng Việt — lọc bỏ khi tính keyword boost */
  private static readonly VIETNAMESE_STOPWORDS = new Set([
    'có', 'là', 'và', 'của', 'những', 'người', 'trong', 'một',
    'các', 'cho', 'với', 'này', 'được', 'đã', 'đang', 'không',
    'thì', 'cũng', 'như', 'khi', 'đến', 'từ', 'hay', 'nhưng',
    'rất', 'nên', 'bạn', 'thân', 'nào', 'còn', 'tôi', 'anh',
  ]);

  constructor(
    private readonly vectorRepository: IVectorRepository,
    private readonly idGenerator: IIdGenerator,
  ) { }

  /**
   * Tìm kiếm vector + re-rank bằng keyword boost và n-gram phrase matching.
   * @param expandedQuery  Câu đã được AI mở rộng (dùng để embed)
   * @param originalQuery  Câu gốc của người dùng (dùng để boost keyword)
   */
  async search(expandedQuery: string, originalQuery: string): Promise<RankedCandidate[]> {
    try {
      const embedding = await this.vectorRepository.embedQuery(expandedQuery);
      const searchQuery = VectorSearchQuery.create({
        id: this.idGenerator.generate(),
        query: expandedQuery,
        embedding,
        limit: SearchRankingService.SEMANTIC_SEARCH_LIMIT,
        threshold: SearchRankingService.SEMANTIC_THRESHOLD,
        contentType: 'book',
      });

      const results = await this.vectorRepository.search(searchQuery);

      const queryLower = originalQuery.toLowerCase();
      const tokens = this.extractSignificantTokens(originalQuery);
      const ngrams = this.extractNgrams(tokens, 2, 3);

      const bookScores = new Map<string, { vectorScore: number; keywordBoost: number }>();

      for (const r of results) {
        const bookId = r.document.metadata.bookId || r.document.contentId;
        if (!bookId) continue;

        const contentLower = r.document.content.toLowerCase();
        const titleLower = ((r.document.metadata.title as string) || '').toLowerCase();

        let keywordBoost = 0;

        // 1. Exact full-phrase boost
        if (contentLower.includes(queryLower)) keywordBoost += 0.4;
        else if (titleLower.includes(queryLower)) keywordBoost += 0.5;

        // 2. N-gram phrase boost — giúp "bầy nhện", "rừng cấm" nặng như tên riêng đơn lẻ
        for (const phrase of ngrams) {
          if (titleLower.includes(phrase)) keywordBoost += SearchRankingService.TITLE_NGRAM_BOOST;
          else if (contentLower.includes(phrase)) keywordBoost += SearchRankingService.CONTENT_NGRAM_BOOST;
        }


        const existing = bookScores.get(bookId);
        if (!existing || r.score > existing.vectorScore) {
          bookScores.set(bookId, {
            vectorScore: r.score,
            keywordBoost: Math.max(existing?.keywordBoost ?? 0, keywordBoost),
          });
        }
      }

      return Array.from(bookScores.entries())
        .map(([id, { vectorScore, keywordBoost }]) => ({
          id,
          score: vectorScore,
          relevanceScore: keywordBoost,
          finalScore: Math.min(vectorScore + keywordBoost, 1.0),
        }))
        .filter((c) => c.finalScore > SearchRankingService.SEMANTIC_THRESHOLD)
        .sort((a, b) => b.finalScore - a.finalScore);
    } catch (e) {
      this.logger.warn(`Semantic search failed: ${e instanceof Error ? e.message : String(e)}`);
      return [];
    }
  }

  private extractSignificantTokens(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !SearchRankingService.VIETNAMESE_STOPWORDS.has(w));
  }

  /** VD: ["bầy", "nhện", "rừng"] → ["bầy nhện", "nhện rừng", "bầy nhện rừng"] */
  private extractNgrams(tokens: string[], minN: number, maxN: number): string[] {
    const ngrams: string[] = [];
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.push(tokens.slice(i, i + n).join(' '));
      }
    }
    return ngrams;
  }
}
