import { Command } from '@nestjs/cqrs';
import { User } from '@/domain/users/entities/user.entity';

export class CreateUserCommand extends Command<User> {
  constructor(
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
