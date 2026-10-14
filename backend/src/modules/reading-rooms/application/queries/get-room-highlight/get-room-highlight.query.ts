import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ReadingRoomHighlightReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';

export class GetRoomHighlightQuery extends Query<ReadingRoomHighlightReadModel> {
  constructor(
    public readonly roomId: string,
    public readonly highlightId: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
