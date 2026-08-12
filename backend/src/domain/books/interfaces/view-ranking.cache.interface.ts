export abstract class IViewRankingCache {
  abstract recordView(bookId: string): Promise<void>;
  abstract getTopBookIds(
    timeRange: 'weekly' | 'monthly',
    limit: number,
  ): Promise<string[]>;
}
