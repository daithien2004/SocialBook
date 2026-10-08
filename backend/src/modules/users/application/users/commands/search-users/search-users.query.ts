import { Query } from '@nestjs/cqrs';

import { User } from '@/modules/users/domain/users/entities/user.entity';
import { PaginationMeta } from '@/shared/domain/pagination.types';
export class SearchUsersQuery extends Query<{
  data: User[];
  meta: PaginationMeta;
}> {
  constructor(
    public readonly query: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
