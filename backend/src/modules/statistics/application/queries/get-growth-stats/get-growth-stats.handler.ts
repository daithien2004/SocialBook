import { GetGrowthStatsQuery } from './get-growth-stats.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IBookQueryProvider } from '@/modules/books/domain/public-api';
import { IPostRepository } from '@/modules/posts/domain/public-api';
import { GrowthMetric } from '@/modules/statistics/domain/read-models/statistics.model';
import { IUserRepository } from '@/modules/users/domain/public-api';

@QueryHandler(GetGrowthStatsQuery)
export class GetGrowthStatsHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly bookQueryProvider: IBookQueryProvider,
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    days: number = 30,
    groupBy: 'day' | 'month' | 'year' = 'day',
  ): Promise<GrowthMetric[]> {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Set start date back by 'days'
    if (groupBy === 'day') {
      startDate.setDate(startDate.getDate() - days);
    } else if (groupBy === 'month') {
      startDate.setMonth(startDate.getMonth() - days / 30);
    } else {
      startDate.setFullYear(startDate.getFullYear() - days / 365);
    }

    const [userGrowth, bookGrowth, postGrowth] = await Promise.all([
      this.userRepository.getGrowthMetrics(startDate, groupBy),
      this.bookQueryProvider.getGrowthMetrics(startDate, groupBy),
      this.postRepository.getGrowthMetrics(startDate, groupBy),
    ]);

    const metricsMap = new Map<string, GrowthMetric>();

    // Helper to generate date ranges
    const now = new Date();
    const current = new Date(startDate);

    while (current <= now) {
      let dateKey: string;
      if (groupBy === 'day') {
        dateKey = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (groupBy === 'month') {
        dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
      } else {
        dateKey = `${current.getFullYear()}`;
        current.setFullYear(current.getFullYear() + 1);
      }

      metricsMap.set(dateKey, {
        date: dateKey,
        users: 0,
        books: 0,
        posts: 0,
      });
    }

    // Merge actual data
    for (const entry of userGrowth) {
      if (metricsMap.has(entry._id)) {
        metricsMap.get(entry._id)!.users = entry.count;
      }
    }
    for (const entry of bookGrowth) {
      if (metricsMap.has(entry._id)) {
        metricsMap.get(entry._id)!.books = entry.count;
      }
    }
    for (const entry of postGrowth) {
      if (metricsMap.has(entry._id)) {
        metricsMap.get(entry._id)!.posts = entry.count;
      }
    }

    return Array.from(metricsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }
}
