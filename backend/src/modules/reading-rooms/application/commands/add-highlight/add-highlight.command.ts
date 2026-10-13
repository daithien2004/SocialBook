import { Command } from '@nestjs/cqrs';
import { ReadingRoomHighlightResult } from '@/modules/reading-rooms/application/reading-room.result';

export class AddHighlightCommand extends Command<ReadingRoomHighlightResult> {
  constructor(
    public readonly roomId: string,
    public readonly userId: string,
    public readonly chapterSlug: string,
    public readonly paragraphId: string,
    public readonly content: string,
    public readonly displayName?: string,
    public readonly avatarUrl?: string,
  ) {
    super();
  }
}
