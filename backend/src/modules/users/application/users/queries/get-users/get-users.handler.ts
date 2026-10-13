import { GetUsersQuery } from './get-users.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { PageResult } from '@/shared/domain/pagination.types';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: GetUsersQuery): Promise<PageResult<User>> {
    return this.userRepository.findAll(
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
