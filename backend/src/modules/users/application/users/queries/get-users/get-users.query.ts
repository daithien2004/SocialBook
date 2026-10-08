import { Query } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';

import { PaginationMeta } from '@/shared/domain/pagination.types';

export class GetUsersQuery extends Query<{
  data: User[];
  meta: PaginationMeta;
}> {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly username?: string,
    public readonly email?: string,
    public readonly roleId?: string,
    public readonly isBanned?: boolean,
    public readonly isVerified?: boolean,
  ) {
    super();
  }
}
