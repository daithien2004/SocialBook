import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import type { Actor } from '@/shared/casl/actor';

export class CreateUserCommand extends Command<User> {
  constructor(
    public readonly actor: Actor,
    public readonly username: string,
    public readonly email: string,
    public readonly password?: string,
    public readonly roleId?: string,
    public readonly image?: string,
    public readonly provider?: string,
    public readonly providerId?: string,
  ) {
    super();
  }
}
