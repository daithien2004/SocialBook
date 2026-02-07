import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { IFollowRepository } from '../../../domain/repositories/follow.repository.interface';
import { Follow } from '../../../domain/entities/follow.entity';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { TargetId } from '../../../domain/value-objects/target-id.vo';
import { CreateFollowCommand } from './create-follow.command';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class CreateFollowUseCase {
    private readonly logger = new Logger(CreateFollowUseCase.name);

    constructor(
        private readonly followRepository: IFollowRepository
    ) {}

    async execute(command: CreateFollowCommand): Promise<Follow> {
        try {
            // Validate user ID and target ID
            const userId = UserId.create(command.userId);
            const targetId = TargetId.create(command.targetId);

            // Check if user is trying to follow themselves
            if (userId.getValue() === targetId.getValue()) {
                throw new BadRequestException('User cannot follow themselves');
            }

            // Check if follow already exists
            const existingFollow = await this.followRepository.exists(userId, targetId);
            
            if (existingFollow) {
                throw new ConflictException('Follow relationship already exists');
            }

            // Create the follow
            const follow = Follow.create({
                userId: command.userId,
                targetId: command.targetId,
                status: command.status !== undefined ? command.status : true
            });

            // Save to repository
            await this.followRepository.save(follow);

            this.logger.log(`Follow created successfully: ${follow.id.toString()} (User: ${command.userId} -> Target: ${command.targetId})`);

            return follow;
        } catch (error) {
            this.logger.error(`Failed to create follow: ${command.userId} -> ${command.targetId}`, error);
            throw error;
        }
    }
}
