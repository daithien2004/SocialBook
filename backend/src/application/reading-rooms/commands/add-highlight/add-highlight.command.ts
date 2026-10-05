import { Command } from '@nestjs/cqrs';
import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';

export class AddHighlightCommand extends Command<ReadingRoom> {
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
