import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class DeleteAuthorCommand extends Command<void> {
  constructor(
    readonly actor: Actor,
    readonly id: string,
  ) {
    super();
  }
}
