import { Query } from '@nestjs/cqrs';
import type { AdminUserReadModel } from '@/modules/users/application/read-models/admin-user.read-model';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { Actor } from '@/shared/casl/actor';

export class GetUsersQuery extends Query<PageResult<AdminUserReadModel>> {
  constructor(
    public readonly actor: Actor,
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
