import { GetOverviewStatsQuery } from './get-overview-stats.query';
import { QueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { OverviewStatsReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertStatisticsReadAllowed } from '@/modules/statistics/application/assert-statistics-read-policy';

@QueryHandler(GetOverviewStatsQuery)
export class GetOverviewStatsHandler {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(query: GetOverviewStatsQuery): Promise<OverviewStatsReadModel> {
    assertStatisticsReadAllowed(query.actor);
    const recentSince = new Date();
    recentSince.setDate(recentSince.getDate() - 30);
    const previousSince = new Date(
      recentSince.getTime() - 30 * 24 * 60 * 60 * 1000,
    );
    return this.statisticsReadRepository.getOverviewStats(
      recentSince,
      previousSince,
    );
  }
}
