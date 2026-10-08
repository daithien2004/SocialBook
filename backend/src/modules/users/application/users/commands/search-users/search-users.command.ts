import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

export class SearchUsersCommand extends Command<PaginatedResult<User>> {
  constructor() {
    super();
  }
}
