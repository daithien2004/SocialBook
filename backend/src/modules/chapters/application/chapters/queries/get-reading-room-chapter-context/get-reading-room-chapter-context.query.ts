import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ReadingRoomChapterContextReadModel } from '@/modules/chapters/application/read-models/reading-room-chapter-context.read-model';

export class GetReadingRoomChapterContextQuery extends Query<ReadingRoomChapterContextReadModel | null> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly chapterSlug: string,
    public readonly selectedText: string,
  ) {
    super();
  }
}
