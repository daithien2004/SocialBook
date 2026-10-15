import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { TrendingKeywordCachePort } from '@/modules/search/application/ports/trending-keyword-cache.port';
import { GetTrendingKeywordsQuery } from './get-trending-keywords.query';
import { ForbiddenError } from '@casl/ability';

@QueryHandler(GetTrendingKeywordsQuery)
export class GetTrendingKeywordsHandler implements IQueryHandler<GetTrendingKeywordsQuery> {
  constructor(
    private readonly trendingKeywordCache: TrendingKeywordCachePort,
  ) {}

  execute(query: GetTrendingKeywordsQuery): Promise<string[]> {
    ForbiddenError.from(query.actor.ability).throwUnlessCan('read', 'Search');
    return this.trendingKeywordCache.getTrendingKeywords(query.limit);
  }
}
