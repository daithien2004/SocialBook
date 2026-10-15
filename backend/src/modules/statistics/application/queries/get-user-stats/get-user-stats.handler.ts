import { GetUserStatsQuery } from './get-user-stats.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { UserStatsReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';

@QueryHandler(GetUserStatsQuery)
export class GetUserStatsHandler implements IQueryHandler<GetUserStatsQuery> {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(query: GetUserStatsQuery): Promise<UserStatsReadModel> {
    assertCanReadStatistics(query.actor);
    const recentSince = new Date();
    recentSince.setDate(recentSince.getDate() - 30);
    return this.statisticsReadRepository.getUserStats(recentSince);
  }
}
