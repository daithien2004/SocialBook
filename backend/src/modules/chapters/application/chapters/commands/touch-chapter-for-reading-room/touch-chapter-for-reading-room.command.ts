import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class TouchChapterForReadingRoomCommand extends Command<string | null> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly chapterId: string,
  ) {
    super();
  }
}
