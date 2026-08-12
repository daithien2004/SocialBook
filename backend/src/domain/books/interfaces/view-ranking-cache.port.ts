export abstract class IViewRankingCachePort {
  abstract recordView(bookId: string): Promise<void>;
  abstract getTopBookIds(
    timeRange: 'weekly' | 'monthly',
    limit: number,
  ): Promise<string[]>;
}
