import { Command } from '@nestjs/cqrs';
import { ReadingRoomResult } from '../../reading-room.interface';

export class ReactivateRoomCommand extends Command<ReadingRoomResult> {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
  ) {
    super();}
}
