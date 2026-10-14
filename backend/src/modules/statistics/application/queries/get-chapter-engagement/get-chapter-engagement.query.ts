import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ChapterEngagementReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class GetChapterEngagementQuery extends Query<
  ChapterEngagementReadModel[]
> {
  constructor(
    public readonly actor: Actor,
    public readonly limit: number,
  ) {
    super();
  }
}
