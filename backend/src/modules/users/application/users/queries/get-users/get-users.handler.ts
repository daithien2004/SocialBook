import { GetUsersQuery } from './get-users.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ForbiddenError } from '@casl/ability';
import { UsersReadRepository } from '@/modules/users/application/ports/users-read.repository';
import type { AdminUserReadModel } from '@/modules/users/application/read-models/admin-user.read-model';
import type { PageResult } from '@/shared/domain/pagination.types';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly usersReadRepository: UsersReadRepository) {}

  async execute(query: GetUsersQuery): Promise<PageResult<AdminUserReadModel>> {
    ForbiddenError.from(query.actor.ability).throwUnlessCan('manage', 'User');
    return this.usersReadRepository.findAdminUsers(
      query.actor.ability,
      {
        username: query.username,
        email: query.email,
        roleId: query.roleId,
        isBanned: query.isBanned,
        isVerified: query.isVerified,
      },
      { offset: (query.page - 1) * query.limit, limit: query.limit },
    );
  }
}
