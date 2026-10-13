import { Command } from '@nestjs/cqrs';

import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.result';

export class CreateRoomCommand extends Command<ReadingRoomResult> {
  constructor(
    public readonly hostId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly mode: 'sync' | 'free',
    public readonly idempotencyKey: string,
    public readonly maxMembers?: number,
  ) {
    super();
  }
}
