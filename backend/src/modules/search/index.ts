export { SearchModule } from './search.module';
export { IntelligentSearchQuery } from './application/queries/intelligent-search/intelligent-search.query';
export { RecordSearchCommand } from './application/commands/record-search/record-search.command';
export { GetTrendingKeywordsQuery } from './application/queries/get-trending-keywords/get-trending-keywords.query';
export type {
  SearchBookResult,
  PaginatedSearchBookResult,
} from './application/dto/search-book-result.dto';
export { TrendingKeywordCachePort } from './application/ports/trending-keyword-cache.port';
