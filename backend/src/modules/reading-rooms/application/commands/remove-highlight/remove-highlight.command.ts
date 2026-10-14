import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class RemoveHighlightCommand extends Command<void> {
  constructor(
    public readonly roomId: string,
    public readonly actor: Actor,
    public readonly highlightId: string,
  ) {
    super();
  }
}
