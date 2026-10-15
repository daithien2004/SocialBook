import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class UpdateUserHighlightCommand extends Command<void> {
  constructor(
    public readonly highlightId: string,
    public readonly actor: Actor,
    public readonly color?: string,
    public readonly note?: string,
  ) {
    super();
  }
}
