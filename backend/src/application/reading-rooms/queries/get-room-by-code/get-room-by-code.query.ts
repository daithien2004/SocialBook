import { Query } from '@nestjs/cqrs';
import { GetRoomByCodeResult } from './get-room-by-code.handler';

export class GetRoomByCodeQuery extends Query<GetRoomByCodeResult> {
  constructor(
    public readonly code: string,
    public readonly userId?: string,
  ) {
    super();
  }
}
