import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class RecordSearchCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly keyword: string,
  ) {
    super();
  }
}
