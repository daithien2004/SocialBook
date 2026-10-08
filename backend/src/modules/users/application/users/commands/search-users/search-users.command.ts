import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { PaginatedResult } from '@/shared/domain/pagination.types';

export class SearchUsersCommand extends Command<PaginatedResult<User>> {
  constructor() {
    super();
  }
}
