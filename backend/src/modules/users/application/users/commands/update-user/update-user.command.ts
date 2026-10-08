import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';

export class UpdateUserCommand extends Command<User> {
  constructor(
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
