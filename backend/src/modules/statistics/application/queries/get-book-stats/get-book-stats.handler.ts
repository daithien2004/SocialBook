import { GetBookStatsQuery } from './get-book-stats.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { BookStatsReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';

@QueryHandler(GetBookStatsQuery)
export class GetBookStatsHandler implements IQueryHandler<GetBookStatsQuery> {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(query: GetBookStatsQuery): Promise<BookStatsReadModel> {
    assertCanReadStatistics(query.actor);
    return this.statisticsReadRepository.getBookStats();
  }
}
