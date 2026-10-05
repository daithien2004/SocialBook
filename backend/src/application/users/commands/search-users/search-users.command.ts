import { Command } from '@nestjs/cqrs';
import { User } from '@/domain/users/entities/user.entity';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

export class SearchUsersCommand extends Command<PaginatedResult<User>> {
  constructor() {
    super();
  }
}
