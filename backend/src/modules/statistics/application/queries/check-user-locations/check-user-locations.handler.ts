import { Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { UserLocationSummaryReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';
import { CheckUserLocationsQuery } from './check-user-locations.query';

@QueryHandler(CheckUserLocationsQuery)
export class CheckUserLocationsHandler implements IQueryHandler<CheckUserLocationsQuery> {
  private readonly logger = new Logger(CheckUserLocationsHandler.name);

  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(
    query: CheckUserLocationsQuery,
  ): Promise<UserLocationSummaryReadModel> {
    assertCanReadStatistics(query.actor);
    this.logger.log('Checking user locations');

    return this.statisticsReadRepository.checkUserLocations();
  }
}
