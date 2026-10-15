import { GetReadingPreferencesQuery } from './get-reading-preferences.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { UsersReadRepository } from '@/modules/users/application/ports/users-read.repository';
import type { ReadingPreferencesReadModel } from '@/modules/users/application/read-models/reading-preferences.read-model';

@QueryHandler(GetReadingPreferencesQuery)
export class GetReadingPreferencesHandler implements IQueryHandler<GetReadingPreferencesQuery> {
  constructor(private readonly usersReadRepository: UsersReadRepository) {}

  async execute(
    query: GetReadingPreferencesQuery,
  ): Promise<ReadingPreferencesReadModel> {
    const preferences = await this.usersReadRepository.findReadingPreferences(
      query.actor.ability,
      query.userId,
    );
    if (!preferences) {
      throw new NotFoundDomainException('User not found');
    }
    return preferences;
  }
}
