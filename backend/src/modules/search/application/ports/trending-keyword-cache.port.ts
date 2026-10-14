export abstract class TrendingKeywordCachePort {
  abstract recordSearch(keyword: string): Promise<void>;
  abstract getTrendingKeywords(limit?: number): Promise<string[]>;
}
