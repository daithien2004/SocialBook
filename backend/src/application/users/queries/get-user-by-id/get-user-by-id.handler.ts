import { GetUserByIdQuery } from './get-user-by-id.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { User } from '@/domain/users/entities/user.entity';
import { UserId } from '@/domain/users/value-objects/user-id.vo';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const userId = UserId.create(query.id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    return user;
  }
}
