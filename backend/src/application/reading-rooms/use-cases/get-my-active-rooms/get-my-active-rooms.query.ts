import { Query } from '@nestjs/cqrs';
import { ReadingRoomResult } from '../../reading-room.interface';

export class GetMyActiveRoomsQuery extends Query<ReadingRoomResult[]> {
  constructor(public readonly userId: string) {
    super();}
}
