import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class ClearCollectionCommand extends Command<{ success: boolean }> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
