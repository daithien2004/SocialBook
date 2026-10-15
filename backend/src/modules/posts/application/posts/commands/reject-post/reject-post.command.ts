import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class RejectPostCommand extends Command<void> {
  constructor(
    public readonly postId: string,
    public readonly reason: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
