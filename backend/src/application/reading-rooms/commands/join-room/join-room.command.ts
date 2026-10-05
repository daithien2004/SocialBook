import { Command } from '@nestjs/cqrs';
import { ReadingRoomResult } from '../../reading-room.interface';

import { ReadingRoomResult } from '@/application/reading-rooms/reading-room.interface';

export class JoinRoomCommand extends Command<ReadingRoomResult> {
  constructor(
    public readonly userId: string,
    public readonly roomCode: string,
  ) {
    super();
  }
}
