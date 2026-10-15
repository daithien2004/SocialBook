import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class DeletePostCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly postId: string,
    public readonly isHardDelete: boolean = false,
  ) {
    super();
  }
}
