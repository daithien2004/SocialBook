import { GetBookStatsQuery } from './get-book-stats.query';
import { QueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { BookStatsReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertStatisticsReadAllowed } from '@/modules/statistics/application/assert-statistics-read-policy';

@QueryHandler(GetBookStatsQuery)
export class GetBookStatsHandler {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  async execute(query: GetBookStatsQuery): Promise<BookStatsReadModel> {
    assertStatisticsReadAllowed(query.actor);
    return this.statisticsReadRepository.getBookStats();
  }
}
