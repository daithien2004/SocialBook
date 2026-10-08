import { Injectable, Logger } from '@nestjs/common';

export interface QueryAnalysis {
  expandedQuery: string;
  targetGenres: string[];
  themes: string[];
  intent: string;
}

@Injectable()
export class SearchQueryExpansionService {
  private readonly logger = new Logger(SearchQueryExpansionService.name);

  expand(query: string): Promise<QueryAnalysis | null> {
    // Đã tắt gọi AI LLM để giảm latency. Dùng thẳng câu query của user để embedding.
    this.logger.debug(`[RAG] Skipping AI expansion for speed: "${query}"`);
    return Promise.resolve({
      expandedQuery: query,
      targetGenres: [],
      themes: [],
      intent: 'direct_search',
    });
  }
}
