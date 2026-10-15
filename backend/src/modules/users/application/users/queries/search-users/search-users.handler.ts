import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ForbiddenError } from '@casl/ability';
import { UsersReadRepository } from '@/modules/users/application/ports/users-read.repository';
import type { PublicUserReadModel } from '@/modules/users/application/read-models/public-user.read-model';
import type { PageResult } from '@/shared/domain/pagination.types';
import { SearchUsersQuery } from './search-users.query';

@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler implements IQueryHandler<
  SearchUsersQuery,
  PageResult<PublicUserReadModel>
> {
  constructor(private readonly usersReadRepository: UsersReadRepository) {}

  async execute(
    query: SearchUsersQuery,
  ): Promise<PageResult<PublicUserReadModel>> {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'read',
      'PublicUser',
    );
    return this.usersReadRepository.findPublicUsers(query.query, {
      offset: ((query.page || 1) - 1) * (query.limit || 10),
      limit: query.limit || 10,
    });
  }
}
