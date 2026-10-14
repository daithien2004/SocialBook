import { QueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { ReadingSpeedReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { GetReadingSpeedQuery } from './get-reading-speed.query';
import { assertStatisticsReadAllowed } from '@/modules/statistics/application/assert-statistics-read-policy';

@QueryHandler(GetReadingSpeedQuery)
export class GetReadingSpeedHandler {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  execute(query: GetReadingSpeedQuery): Promise<ReadingSpeedReadModel[]> {
    assertStatisticsReadAllowed(query.actor);
    return this.statisticsReadRepository.getReadingSpeed(query.days);
  }
}
