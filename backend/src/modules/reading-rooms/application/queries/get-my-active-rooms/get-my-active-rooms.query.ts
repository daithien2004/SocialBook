import { Query } from '@nestjs/cqrs';

import { ReadingRoomSummaryResult } from '@/modules/reading-rooms/application/reading-room.interface';

export class GetMyActiveRoomsQuery extends Query<ReadingRoomSummaryResult[]> {
  constructor(public readonly userId: string) {
    super();
  }
}
