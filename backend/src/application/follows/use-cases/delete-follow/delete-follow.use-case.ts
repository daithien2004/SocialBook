import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IFollowRepository } from '@/domain/follows/repositories/follow.repository.interface';
import { UserId } from '@/domain/follows/value-objects/user-id.vo';
import { TargetId } from '@/domain/follows/value-objects/target-id.vo';
import { DeleteFollowCommand } from './delete-follow.command';

@Injectable()
export class DeleteFollowUseCase {
    private readonly logger = new Logger(DeleteFollowUseCase.name);

    constructor(
        private readonly followRepository: IFollowRepository
    ) {}

    async execute(command: DeleteFollowCommand) {
        try {
            // Find the existing follow
            const existingFollow = await this.followRepository.exists(
                UserId.create(command.userId),
                TargetId.create(command.targetId)
            );

            if (!existingFollow) {
                throw new NotFoundException('Follow relationship not found');
            }

            // Check if user can delete this follow (only the follower can delete)
            if (existingFollow.userId.getValue() !== command.userId) {
                throw new ForbiddenException('You can only delete your own follows');
            }

            // Delete the follow
            await this.followRepository.delete(existingFollow.id);

            this.logger.log(`Follow deleted successfully: ${existingFollow.id.toString()} (User: ${command.userId} -> Target: ${command.targetId})`);

            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to delete follow: ${command.userId} -> ${command.targetId}`, error);
            throw error;
        }
    }
}


