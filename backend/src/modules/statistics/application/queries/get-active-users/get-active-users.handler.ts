import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { ActiveUsersReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';
import { GetActiveUsersQuery } from './get-active-users.query';

@QueryHandler(GetActiveUsersQuery)
export class GetActiveUsersHandler implements IQueryHandler<GetActiveUsersQuery> {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(query: GetActiveUsersQuery): Promise<ActiveUsersReadModel> {
    assertCanReadStatistics(query.actor);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count =
      await this.statisticsReadRepository.countActiveUsers(fiveMinutesAgo);
    return { count, timestamp: new Date().toISOString() };
  }
}
