import { GetGrowthStatsQuery } from './get-growth-stats.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { GrowthMetricReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';

@QueryHandler(GetGrowthStatsQuery)
export class GetGrowthStatsHandler implements IQueryHandler<GetGrowthStatsQuery> {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(query: GetGrowthStatsQuery): Promise<GrowthMetricReadModel[]> {
    assertCanReadStatistics(query.actor);
    const { days, groupBy } = query;
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

    const actualMetrics = await this.statisticsReadRepository.getGrowthStats(
      startDate,
      groupBy,
    );
    const metricsByDate = new Map(
      actualMetrics.map((metric) => [metric.date, metric]),
    );
    const result: GrowthMetricReadModel[] = [];
    const now = new Date();
    const current = new Date(startDate);

    while (current <= now) {
      let date: string;
      if (groupBy === 'day') {
        date = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (groupBy === 'month') {
        date = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
      } else {
        date = `${current.getFullYear()}`;
        current.setFullYear(current.getFullYear() + 1);
      }
      result.push(
        metricsByDate.get(date) ?? { date, users: 0, books: 0, posts: 0 },
      );
    }

    return result;
  }
}
