import { Query } from '@nestjs/cqrs';
import { ReadingRoomSummaryResult } from '@/modules/reading-rooms/application/reading-room.interface';

export class GetMyHistoryQuery extends Query<{
  items: ReadingRoomSummaryResult[];
  total: number;
}> {
  constructor(
    public readonly userId: string,
    public readonly skip?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
