import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/public-api';
import type { Actor } from '@/shared/casl/actor';

export class ValidateUserCommand extends Command<User | null> {
  constructor(
    public readonly actor: Actor,
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
