import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class DeleteCommentCommand extends Command<void> {
  constructor(
    public readonly id: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
