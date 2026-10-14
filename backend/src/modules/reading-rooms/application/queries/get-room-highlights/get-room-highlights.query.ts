import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GetRoomHighlightsReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';

export class GetRoomHighlightsQuery extends Query<GetRoomHighlightsReadModel> {
  constructor(
    public readonly code: string,
    public readonly actor: Actor,
    public readonly offset: number,
    public readonly limit: number,
  ) {
    super();
  }
}
