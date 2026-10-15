import { Query } from '@nestjs/cqrs';
import { ChapterDetailReadModel } from '@/modules/chapters/application/read-models/chapter-detail.read-model';
import type { Actor } from '@/shared/casl/actor';

export class GetChapterBySlugQuery extends Query<ChapterDetailReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly chapterSlug: string,
    public readonly bookSlug: string,
  ) {
    super();
  }
}
