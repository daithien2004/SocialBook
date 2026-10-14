import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ChapterDetailReadModel } from '@/modules/chapters';

export class GetCurrentRoomChapterQuery extends Query<ChapterDetailReadModel> {
  constructor(
    public readonly roomCode: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
