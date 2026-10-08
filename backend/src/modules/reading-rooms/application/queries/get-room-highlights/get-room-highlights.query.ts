import { Query } from '@nestjs/cqrs';
import { ReadingRoomHighlightPage } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';

export class GetRoomHighlightsQuery extends Query<ReadingRoomHighlightPage> {
  constructor(
    public readonly code: string,
    public readonly userId: string,
    public readonly offset: number,
    public readonly limit: number,
  ) {
    super();
  }
}
