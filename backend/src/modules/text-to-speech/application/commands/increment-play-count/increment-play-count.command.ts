import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
export class IncrementPlayCountCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly chapterId: string,
  ) {
    super();
  }
}
