import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { GetFollowingQuery } from './get-following.query';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { FollowWithUserInfoResult } from '../../follow.result';

@QueryHandler(GetFollowingQuery)
export class GetFollowingHandler implements IQueryHandler<GetFollowingQuery> {
  private readonly logger = new Logger(GetFollowingHandler.name);

  constructor(private readonly followRepository: IFollowRepository) {}

  async execute(
    query: GetFollowingQuery,
  ): Promise<PageResult<FollowWithUserInfoResult>> {
    try {
      if (!query.actor.ability.can('read', 'Follow')) {
        throw new ForbiddenDomainException('FOLLOW_READ_FORBIDDEN');
      }
      this.logger.log(`Getting following list for user ${query.userId}`);
      const result = await this.followRepository.findByUserWithUserInfo(
        query.userId,
        query.page,
        query.limit,
      );
      this.logger.log(
        `Retrieved ${result.data.length} following for user ${query.userId}`,
      );
      return { items: result.data, total: result.meta.total };
    } catch (error) {
      this.logger.error(
        `Failed to get following list for user ${query.userId}`,
        error,
      );
      throw error;
    }
  }
}
