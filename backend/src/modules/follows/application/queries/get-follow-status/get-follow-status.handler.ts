import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { UserId } from '@/modules/follows/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/follows/domain/value-objects/target-id.vo';
import { GetFollowStatusQuery } from './get-follow-status.query';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';

@QueryHandler(GetFollowStatusQuery)
export class GetFollowStatusHandler implements IQueryHandler<GetFollowStatusQuery> {
  private readonly logger = new Logger(GetFollowStatusHandler.name);

  constructor(private readonly followRepository: IFollowRepository) {}

  async execute(query: GetFollowStatusQuery) {
    try {
      if (!query.actor.ability.can('read', 'Follow')) {
        throw new ForbiddenDomainException('FOLLOW_READ_FORBIDDEN');
      }
      const userId = UserId.create(query.actor.userId);
      const targetId = TargetId.create(query.targetId);

      const isOwner = userId.getValue() === targetId.getValue();

      const followStatus = await this.followRepository.getFollowStatus(
        userId,
        targetId,
      );

      return {
        userId: query.actor.userId,
        targetId: query.targetId,
        isFollowing: followStatus.isFollowing,
        isOwner,
        followId: followStatus.followId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get follow status: ${query.actor.userId} -> ${query.targetId}`,
        error,
      );
      throw error;
    }
  }
}
