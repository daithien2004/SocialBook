import { Command } from '@nestjs/cqrs';
import { LeaveRoomResult } from '../../reading-room.interface';

export class LeaveRoomCommand extends Command<LeaveRoomResult> {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly newHostId?: string,
  ) {
    super();}
}
