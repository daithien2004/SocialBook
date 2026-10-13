import { Query } from '@nestjs/cqrs';
import type { GetRoomHighlightsResult } from '@/modules/reading-rooms/application/reading-room.result';

export class GetRoomHighlightsQuery extends Query<GetRoomHighlightsResult> {
  constructor(
    public readonly code: string,
    public readonly userId: string,
    public readonly offset: number,
    public readonly limit: number,
  ) {
    super();
  }
}
