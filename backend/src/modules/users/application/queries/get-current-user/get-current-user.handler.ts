import { ForbiddenError, subject } from '@casl/ability';
import { QueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { CurrentUserReadRepository } from '../../ports/current-user-read.repository';
import type { CurrentUserReadModel } from '../../read-models/current-user.read-model';
import { GetCurrentUserQuery } from './get-current-user.query';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler {
  constructor(private readonly readRepository: CurrentUserReadRepository) {}

  async execute(query: GetCurrentUserQuery): Promise<CurrentUserReadModel> {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'read',
      subject('User', { id: query.actor.userId }),
    );
    const user = await this.readRepository.findCurrentUser(
      query.actor.ability,
      query.actor.userId,
    );
    if (!user) throw new NotFoundDomainException('User not found');
    return user;
  }
}
