import { Command } from '@nestjs/cqrs';

import { ReadingRoomResult } from '@/application/reading-rooms/reading-room.interface';

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
