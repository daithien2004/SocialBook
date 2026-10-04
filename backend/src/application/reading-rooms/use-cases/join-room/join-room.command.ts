import { Command } from '@nestjs/cqrs';
import { ReadingRoomResult } from '../../reading-room.interface';

export class JoinRoomCommand extends Command<ReadingRoomResult> {
  constructor(
    public readonly userId: string,
    public readonly roomCode: string,
  ) {
    super();
  }
}
