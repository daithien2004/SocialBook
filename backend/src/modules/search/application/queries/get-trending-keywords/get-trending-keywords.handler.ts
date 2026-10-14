import { QueryHandler } from '@nestjs/cqrs';
import { TrendingKeywordCachePort } from '@/modules/search/application/ports/trending-keyword-cache.port';
import { GetTrendingKeywordsQuery } from './get-trending-keywords.query';

@QueryHandler(GetTrendingKeywordsQuery)
export class GetTrendingKeywordsHandler {
  constructor(
    private readonly trendingKeywordCache: TrendingKeywordCachePort,
  ) {}

  execute(query: GetTrendingKeywordsQuery): Promise<string[]> {
    return this.trendingKeywordCache.getTrendingKeywords(query.limit);
  }
}
