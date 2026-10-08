import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';

export class ToggleBanCommand extends Command<User> {
  constructor(public readonly userId: string) {
    super();
  }
}
