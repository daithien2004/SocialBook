import { Command } from '@nestjs/cqrs';
import { LeaveRoomResult } from '@/modules/reading-rooms/application/reading-room.result';

export class LeaveRoomCommand extends Command<LeaveRoomResult> {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly newHostId?: string,
  ) {
    super();
  }
}
