export { SearchModule } from './search.module';
export { SearchApplicationModule } from './application/search-application.module';
export { IntelligentSearchHandler } from './application/queries/intelligent-search/intelligent-search.handler';
export { IntelligentSearchQuery } from './application/queries/intelligent-search/intelligent-search.query';
export type {
  SearchBookResult,
  PaginatedSearchBookResult,
} from './application/dto/search-book-result.dto';
export type { ITrendingKeywordCachePort } from './domain/interfaces/trending-keyword-cache.port';
