import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class LogoutCommand extends Command<{ message: string }> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
  ) {
    super();
  }
}
