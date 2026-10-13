import { Command } from '@nestjs/cqrs';

import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.result';

export class JoinRoomCommand extends Command<ReadingRoomResult> {
  constructor(
    public readonly userId: string,
    public readonly roomCode: string,
  ) {
    super();
  }
}
