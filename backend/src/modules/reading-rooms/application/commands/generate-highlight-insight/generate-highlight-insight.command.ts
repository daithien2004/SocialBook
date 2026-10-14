import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class GenerateHighlightInsightCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly roomId: string,
    public readonly highlightId: string,
  ) {
    super();
  }
}
