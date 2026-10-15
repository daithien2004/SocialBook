import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { GeographicReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';
import { GetGeographicDistributionQuery } from './get-geographic-distribution.query';

@QueryHandler(GetGeographicDistributionQuery)
export class GetGeographicDistributionHandler implements IQueryHandler<GetGeographicDistributionQuery> {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  execute(
    query: GetGeographicDistributionQuery,
  ): Promise<GeographicReadModel[]> {
    assertCanReadStatistics(query.actor);
    return this.statisticsReadRepository.getGeographicDistribution();
  }
}
