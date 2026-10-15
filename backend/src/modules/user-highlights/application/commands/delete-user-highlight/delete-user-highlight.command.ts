import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class DeleteUserHighlightCommand extends Command<void> {
  constructor(
    public readonly highlightId: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
