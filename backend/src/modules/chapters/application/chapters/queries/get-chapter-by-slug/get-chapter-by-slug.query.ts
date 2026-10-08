import { Query } from '@nestjs/cqrs';
import { ChapterDetailReadModel } from '@/modules/chapters/domain/chapters/read-models/chapter-detail.read-model';

export class GetChapterBySlugQuery extends Query<ChapterDetailReadModel> {
  constructor(
    public readonly chapterSlug: string,
    public readonly bookSlug: string,
  ) {
    super();
  }
}
