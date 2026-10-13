import { SearchUsersCommand } from './search-users.command';
import { CommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { PageResult } from '@/shared/domain/pagination.types';
import { SearchUsersQuery } from './search-users.query';

@CommandHandler(SearchUsersCommand)
export class SearchUsersHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: SearchUsersQuery): Promise<PageResult<User>> {
    return this.userRepository.findAll(
      { username: query.query },
      {
        offset: ((query.page || 1) - 1) * (query.limit || 10),
        limit: query.limit || 10,
      },
    );
  }
}
