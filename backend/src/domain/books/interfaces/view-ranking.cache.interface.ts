export const VIEW_RANKING_CACHE_TOKEN = 'IViewRankingCache';

export interface IViewRankingCache {
  recordView(bookId: string): Promise<void>;
  getTopBookIds(
    timeRange: 'weekly' | 'monthly',
    limit: number,
  ): Promise<string[]>;
}
