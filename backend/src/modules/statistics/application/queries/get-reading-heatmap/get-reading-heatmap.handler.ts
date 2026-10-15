import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { ReadingHeatmapReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';
import { GetReadingHeatmapQuery } from './get-reading-heatmap.query';

@QueryHandler(GetReadingHeatmapQuery)
export class GetReadingHeatmapHandler implements IQueryHandler<GetReadingHeatmapQuery> {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  execute(query: GetReadingHeatmapQuery): Promise<ReadingHeatmapReadModel[]> {
    assertCanReadStatistics(query.actor);
    return this.statisticsReadRepository.getReadingHeatmap();
  }
}
