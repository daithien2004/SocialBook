export abstract class ITrendingKeywordCache {
  abstract recordSearch(keyword: string): Promise<void>;
  abstract getTrendingKeywords(limit?: number): Promise<string[]>;
}
