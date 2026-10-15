import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type { ChapterEngagementReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';
import { assertCanReadStatistics } from '../../policies/statistics-access.policy';
import { GetChapterEngagementQuery } from './get-chapter-engagement.query';

@QueryHandler(GetChapterEngagementQuery)
export class GetChapterEngagementHandler implements IQueryHandler<GetChapterEngagementQuery> {
  constructor(
    private readonly statisticsReadRepository: StatisticsReadRepository,
  ) {}

  execute(
    query: GetChapterEngagementQuery,
  ): Promise<ChapterEngagementReadModel[]> {
    assertCanReadStatistics(query.actor);
    return this.statisticsReadRepository.getChapterEngagement(query.limit);
  }
}
