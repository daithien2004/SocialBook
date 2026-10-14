import { QueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { ChapterEngagementReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { GetChapterEngagementQuery } from './get-chapter-engagement.query';
import { assertStatisticsReadAllowed } from '@/modules/statistics/application/assert-statistics-read-policy';

@QueryHandler(GetChapterEngagementQuery)
export class GetChapterEngagementHandler {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  execute(
    query: GetChapterEngagementQuery,
  ): Promise<ChapterEngagementReadModel[]> {
    assertStatisticsReadAllowed(query.actor);
    return this.statisticsReadRepository.getChapterEngagement(query.limit);
  }
}
