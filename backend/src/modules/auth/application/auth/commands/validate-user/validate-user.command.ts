import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/public-api';

export class ValidateUserCommand extends Command<User | null> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
