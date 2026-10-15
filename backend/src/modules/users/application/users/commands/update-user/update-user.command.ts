import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import type { Actor } from '@/shared/casl/actor';

export class UpdateUserCommand extends Command<User> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
    public readonly username?: string,
    public readonly bio?: string,
    public readonly location?: string,
    public readonly website?: string,
    public readonly image?: string,
  ) {
    super();
  }
}
