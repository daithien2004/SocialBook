import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { ReadingSpeedReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';
import { GetReadingSpeedQuery } from './get-reading-speed.query';

@QueryHandler(GetReadingSpeedQuery)
export class GetReadingSpeedHandler implements IQueryHandler<GetReadingSpeedQuery> {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  execute(query: GetReadingSpeedQuery): Promise<ReadingSpeedReadModel[]> {
    assertCanReadStatistics(query.actor);
    return this.statisticsReadRepository.getReadingSpeed(query.days);
  }
}
