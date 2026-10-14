import { Logger } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { UserLocationSummaryReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertStatisticsReadAllowed } from '@/modules/statistics/application/assert-statistics-read-policy';
import { CheckUserLocationsQuery } from './check-user-locations.query';

@QueryHandler(CheckUserLocationsQuery)
export class CheckUserLocationsHandler {
  private readonly logger = new Logger(CheckUserLocationsHandler.name);

  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(
    query: CheckUserLocationsQuery,
  ): Promise<UserLocationSummaryReadModel> {
    assertStatisticsReadAllowed(query.actor);
    this.logger.log('Checking user locations');

    return this.statisticsReadRepository.checkUserLocations();
  }
}
