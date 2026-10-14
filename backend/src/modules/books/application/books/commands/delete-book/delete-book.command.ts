import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class DeleteBookCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
  ) {
    super();
  }
}
