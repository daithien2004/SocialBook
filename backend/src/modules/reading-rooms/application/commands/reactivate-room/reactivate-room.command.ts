import { Command } from '@nestjs/cqrs';

import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.result';

export class ReactivateRoomCommand extends Command<ReadingRoomResult> {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
  ) {
    super();
  }
}
