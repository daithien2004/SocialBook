import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { UserId } from '@/modules/follows/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/follows/domain/value-objects/target-id.vo';
import { GetFollowStatusQuery } from './get-follow-status.query';

@QueryHandler(GetFollowStatusQuery)
export class GetFollowStatusHandler implements IQueryHandler<GetFollowStatusQuery> {
  private readonly logger = new Logger(GetFollowStatusHandler.name);

  constructor(private readonly followRepository: IFollowRepository) {}

  async execute(query: GetFollowStatusQuery) {
    try {
      const userId = UserId.create(query.userId);
      const targetId = TargetId.create(query.targetId);

      const isOwner = userId.getValue() === targetId.getValue();

      const followStatus = await this.followRepository.getFollowStatus(
        userId,
        targetId,
      );

      return {
        userId: query.userId,
        targetId: query.targetId,
        isFollowing: followStatus.isFollowing,
        isOwner,
        followId: followStatus.followId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get follow status: ${query.userId} -> ${query.targetId}`,
        error,
      );
      throw error;
    }
  }
}
