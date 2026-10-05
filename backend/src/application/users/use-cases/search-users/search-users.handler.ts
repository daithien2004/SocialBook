import { SearchUsersCommand } from './search-users.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { User } from '@/domain/users/entities/user.entity';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { SearchUsersQuery } from './search-users.query';

@CommandHandler(SearchUsersCommand)
export class SearchUsersHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: SearchUsersQuery): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(
      { username: query.query },
      { page: query.page || 1, limit: query.limit || 10 },
    );
  }
}
