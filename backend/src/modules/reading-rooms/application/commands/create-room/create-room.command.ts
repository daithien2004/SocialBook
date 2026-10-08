import { Command } from '@nestjs/cqrs';

import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.interface';

export class CreateRoomCommand extends Command<ReadingRoomResult> {
  constructor(
    public readonly hostId: string,
    public readonly bookId: string,
    public readonly currentChapterSlug: string,
    public readonly mode: 'sync' | 'free',
    public readonly maxMembers?: number,
  ) {
    super();
  }
}
