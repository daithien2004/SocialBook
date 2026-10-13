import { Query } from '@nestjs/cqrs';
import type { GetRoomByCodeResult } from '@/modules/reading-rooms/application/reading-room.result';

export class GetRoomByCodeQuery extends Query<GetRoomByCodeResult> {
  constructor(
    public readonly code: string,
    public readonly userId?: string,
  ) {
    super();
  }
}
