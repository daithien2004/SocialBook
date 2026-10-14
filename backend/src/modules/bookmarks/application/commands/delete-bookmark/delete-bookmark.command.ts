import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class DeleteBookmarkCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly paragraphId: string,
  ) {
    super();
  }
}
