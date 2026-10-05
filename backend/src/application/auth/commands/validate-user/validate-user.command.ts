import { Command } from '@nestjs/cqrs';
import { User } from '@/domain/users/entities/user.entity';

export class ValidateUserCommand extends Command<User | null> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
