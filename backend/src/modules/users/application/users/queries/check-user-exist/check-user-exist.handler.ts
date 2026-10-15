import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ForbiddenError } from '@casl/ability';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { CheckUserExistQuery } from './check-user-exist.query';

@QueryHandler(CheckUserExistQuery)
export class CheckUserExistHandler implements IQueryHandler<CheckUserExistQuery> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: CheckUserExistQuery): Promise<boolean> {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'read',
      'PublicUser',
    );
    const userId = UserId.create(query.id);
    const user = await this.userRepository.findById(userId);
    return !!user;
  }
}
