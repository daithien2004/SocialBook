import { Injectable, Logger } from '@nestjs/common';
import { IFollowRepository } from '@/domain/follows/repositories/follow.repository.interface';
import { UserId } from '@/domain/follows/value-objects/user-id.vo';
import { TargetId } from '@/domain/follows/value-objects/target-id.vo';
import { GetFollowStatusQuery } from './get-follow-status.query';

@Injectable()
export class GetFollowStatusUseCase {
    private readonly logger = new Logger(GetFollowStatusUseCase.name);

    constructor(
        private readonly followRepository: IFollowRepository
    ) { }

    async execute(query: GetFollowStatusQuery) {
        try {
            const userId = UserId.create(query.userId);
            const targetId = TargetId.create(query.targetId);

            const isOwner = userId.getValue() === targetId.getValue();

            const followStatus = await this.followRepository.getFollowStatus(userId, targetId);

            return {
                userId: query.userId,
                targetId: query.targetId,
                isFollowing: followStatus.isFollowing,
                isOwner,
                followId: followStatus.followId
            };
        } catch (error) {
            this.logger.error(`Failed to get follow status: ${query.userId} -> ${query.targetId}`, error);
            throw error;
        }
    }
}
