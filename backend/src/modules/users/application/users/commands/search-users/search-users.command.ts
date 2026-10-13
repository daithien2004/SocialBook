import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { PageResult } from '@/shared/domain/pagination.types';

export class SearchUsersCommand extends Command<PageResult<User>> {
  constructor() {
    super();
  }
}
