import { GetReadingPreferencesQuery } from './get-reading-preferences.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { ReadingPreferences } from '@/domain/users/value-objects/reading-preferences.vo';

@QueryHandler(GetReadingPreferencesQuery)
export class GetReadingPreferencesHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    query: GetReadingPreferencesQuery,
  ): Promise<ReadingPreferences> {
    const userId = UserId.create(query.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    return user.readingPreferences || ReadingPreferences.createDefault();
  }
}
