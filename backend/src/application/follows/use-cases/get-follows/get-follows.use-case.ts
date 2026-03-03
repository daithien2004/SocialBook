import { Injectable, Logger } from '@nestjs/common';
import { IFollowRepository } from '@/domain/follows/repositories/follow.repository.interface';
import { UserId } from '@/domain/follows/value-objects/user-id.vo';
import { TargetId } from '@/domain/follows/value-objects/target-id.vo';
import { GetFollowsQuery } from './get-follows.query';

@Injectable()
export class GetFollowsUseCase {
    private readonly logger = new Logger(GetFollowsUseCase.name);

    constructor(
        private readonly followRepository: IFollowRepository
    ) { }

    async execute(query: GetFollowsQuery) {
        try {
            const pagination = {
                page: query.page || 1,
                limit: query.limit || 10
            };

            const sort = {
                sortBy: query.sortBy || 'createdAt',
                order: query.order || 'desc'
            };

            let result;

            if (query.userId) {
                const userId = UserId.create(query.userId);
                result = await this.followRepository.findByUser(userId, pagination, sort);
            } else if (query.targetId) {
                const targetId = TargetId.create(query.targetId);
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
