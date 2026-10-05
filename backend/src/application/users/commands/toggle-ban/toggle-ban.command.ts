import { Command } from '@nestjs/cqrs';
import { User } from '@/domain/users/entities/user.entity';

export class ToggleBanCommand extends Command<User> {
  constructor(public readonly userId: string) {
    super();
  }
}
