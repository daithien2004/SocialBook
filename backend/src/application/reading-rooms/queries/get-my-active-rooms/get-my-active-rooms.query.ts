import { Query } from '@nestjs/cqrs';

import { ReadingRoomResult } from '@/application/reading-rooms/reading-room.interface';

export class GetMyActiveRoomsQuery extends Query<ReadingRoomResult[]> {
  constructor(public readonly userId: string) {
    super();
  }
}
