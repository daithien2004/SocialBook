export abstract class ITrendingKeywordCachePort {
  abstract recordSearch(keyword: string): Promise<void>;
  abstract getTrendingKeywords(limit?: number): Promise<string[]>;
}
