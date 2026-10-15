import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import type { Actor } from '@/shared/casl/actor';

export class ToggleBanCommand extends Command<User> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
  ) {
    super();
  }
}
