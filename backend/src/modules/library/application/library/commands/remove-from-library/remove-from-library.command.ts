import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class RemoveFromLibraryCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly bookId: string,
  ) {
    super();
  }
}
