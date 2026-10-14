import { GetUserStatsQuery } from './get-user-stats.query';
import { QueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { UserStatsReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertStatisticsReadAllowed } from '@/modules/statistics/application/assert-statistics-read-policy';

@QueryHandler(GetUserStatsQuery)
export class GetUserStatsHandler {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(query: GetUserStatsQuery): Promise<UserStatsReadModel> {
    assertStatisticsReadAllowed(query.actor);
    const recentSince = new Date();
    recentSince.setDate(recentSince.getDate() - 30);
    return this.statisticsReadRepository.getUserStats(recentSince);
  }
}
