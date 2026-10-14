import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ChapterDetailReadModel } from '@/modules/chapters/application/read-models/chapter-detail.read-model';

export class GetReadingRoomChapterQuery extends Query<ChapterDetailReadModel | null> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly chapterId: string,
  ) {
    super();
  }
}
