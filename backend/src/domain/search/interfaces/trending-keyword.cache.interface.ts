export const TRENDING_KEYWORD_CACHE_TOKEN = 'ITrendingKeywordCache';

export interface ITrendingKeywordCache {
  recordSearch(keyword: string): Promise<void>;
  getTrendingKeywords(limit?: number): Promise<string[]>;
}
