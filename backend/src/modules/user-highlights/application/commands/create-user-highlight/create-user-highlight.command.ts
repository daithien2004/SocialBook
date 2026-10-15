import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class CreateUserHighlightCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly paragraphId: string,
    public readonly content: string,
    public readonly color?: string,
    public readonly note?: string,
  ) {
    super();
  }
}
