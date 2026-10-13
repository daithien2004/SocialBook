import { Query } from '@nestjs/cqrs';

import { User } from '@/modules/users/domain/users/entities/user.entity';
import { PageResult } from '@/shared/domain/pagination.types';
export class SearchUsersQuery extends Query<PageResult<User>> {
  constructor(
    public readonly query: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
