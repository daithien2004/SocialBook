import { QueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { ReadingHeatmapReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { GetReadingHeatmapQuery } from './get-reading-heatmap.query';
import { assertStatisticsReadAllowed } from '@/modules/statistics/application/assert-statistics-read-policy';

@QueryHandler(GetReadingHeatmapQuery)
export class GetReadingHeatmapHandler {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  execute(query: GetReadingHeatmapQuery): Promise<ReadingHeatmapReadModel[]> {
    assertStatisticsReadAllowed(query.actor);
    return this.statisticsReadRepository.getReadingHeatmap();
  }
}
