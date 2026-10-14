import { QueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { GeographicReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { GetGeographicDistributionQuery } from './get-geographic-distribution.query';
import { assertStatisticsReadAllowed } from '@/modules/statistics/application/assert-statistics-read-policy';

@QueryHandler(GetGeographicDistributionQuery)
export class GetGeographicDistributionHandler {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  execute(
    query: GetGeographicDistributionQuery,
  ): Promise<GeographicReadModel[]> {
    assertStatisticsReadAllowed(query.actor);
    return this.statisticsReadRepository.getGeographicDistribution();
  }
}
