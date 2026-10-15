import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class ModerateCommentCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
    public readonly status: 'approved' | 'rejected',
    public readonly reason?: string,
  ) {
    super();
  }
}
