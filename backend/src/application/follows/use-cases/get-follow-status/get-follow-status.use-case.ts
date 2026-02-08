import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IFollowRepository } from '@/domain/follows/repositories/follow.repository.interface';
import { UserId } from '@/domain/follows/value-objects/user-id.vo';
import { TargetId } from '@/domain/follows/value-objects/target-id.vo';
import { GetFollowStatusCommand } from './get-follow-status.command';

@Injectable()
export class GetFollowStatusUseCase {
    private readonly logger = new Logger(GetFollowStatusUseCase.name);

    constructor(
        private readonly followRepository: IFollowRepository
    ) {}

    async execute(command: GetFollowStatusCommand) {
        try {
            // Validate user ID and target ID
            const userId = UserId.create(command.userId);
            const targetId = TargetId.create(command.targetId);

            // Check if user is trying to check their own follow status
            const isOwner = userId.getValue() === targetId.getValue();

            // Get follow status
            const followStatus = await this.followRepository.getFollowStatus(userId, targetId);

            return {
                userId: command.userId,
                targetId: command.targetId,
                isFollowing: followStatus.isFollowing,
                isOwner,
                followId: followStatus.followId
            };
        } catch (error) {
            this.logger.error(`Failed to get follow status: ${command.userId} -> ${command.targetId}`, error);
            throw error;
        }
    }
}


