import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { FollowResult } from '../../follow.result';
export class CreateFollowCommand extends Command<FollowResult> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
  ) {
    super();
  }
}
