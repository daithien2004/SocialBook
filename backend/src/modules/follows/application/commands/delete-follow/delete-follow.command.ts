import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class DeleteFollowCommand extends Command<{ success: boolean }> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
  ) {
    super();
  }
}
