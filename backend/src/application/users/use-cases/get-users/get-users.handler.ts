import { GetUsersQuery } from './get-users.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { User } from '@/domain/users/entities/user.entity';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: GetUsersQuery): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(
      {
        username: query.username,
        email: query.email,
        roleId: query.roleId,
        isBanned: query.isBanned,
        isVerified: query.isVerified,
      },
      { page: query.page, limit: query.limit },
    );
  }
}
