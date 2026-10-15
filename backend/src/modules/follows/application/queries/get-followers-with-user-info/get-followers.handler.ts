import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { GetFollowersQuery } from './get-followers.query';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { FollowWithUserInfoResult } from '../../follow.result';

@QueryHandler(GetFollowersQuery)
export class GetFollowersHandler implements IQueryHandler<GetFollowersQuery> {
  private readonly logger = new Logger(GetFollowersHandler.name);

  constructor(private readonly followRepository: IFollowRepository) {}

  async execute(
    query: GetFollowersQuery,
  ): Promise<PageResult<FollowWithUserInfoResult>> {
    try {
      if (!query.actor.ability.can('read', 'Follow')) {
        throw new ForbiddenDomainException('FOLLOW_READ_FORBIDDEN');
      }
      this.logger.log(`Getting followers list for user ${query.targetId}`);
      const result = await this.followRepository.findByTargetWithUserInfo(
        query.targetId,
        query.page,
        query.limit,
      );
      this.logger.log(
        `Retrieved ${result.data.length} followers for user ${query.targetId}`,
      );
      return { items: result.data, total: result.meta.total };
    } catch (error) {
      this.logger.error(
        `Failed to get followers list for user ${query.targetId}`,
        error,
      );
      throw error;
    }
  }
}
