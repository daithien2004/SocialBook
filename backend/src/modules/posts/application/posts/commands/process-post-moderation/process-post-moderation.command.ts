import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class ProcessPostModerationCommand extends Command<void> {
  constructor(
    public readonly postId: string,
    public readonly content: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
