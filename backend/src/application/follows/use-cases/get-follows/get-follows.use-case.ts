import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IFollowRepository } from '@/domain/follows/repositories/follow.repository.interface';
import { UserId } from '@/domain/follows/value-objects/user-id.vo';
import { TargetId } from '@/domain/follows/value-objects/target-id.vo';
import { GetFollowsCommand } from './get-follows.command';

@Injectable()
export class GetFollowsUseCase {
    private readonly logger = new Logger(GetFollowsUseCase.name);

    constructor(
        private readonly followRepository: IFollowRepository
    ) {}

    async execute(command: GetFollowsCommand) {
        try {
            const pagination = {
                page: command.page || 1,
                limit: command.limit || 10
            };

            const sort = {
                sortBy: command.sortBy || 'createdAt',
                order: command.order || 'desc'
            };

            let result;

            if (command.userId) {
                const userId = UserId.create(command.userId);
                result = await this.followRepository.findByUser(userId, pagination, sort);
            } else if (command.targetId) {
                const targetId = TargetId.create(command.targetId);
                result = await this.followRepository.findByTarget(targetId, pagination, sort);
            } else {
                result = await this.followRepository.findAll({}, pagination, sort);
            }

            this.logger.log(`Retrieved ${result.data.length} follows`);

            return result;
        } catch (error) {
            this.logger.error('Failed to get follows', error);
            throw error;
        }
    }
}


