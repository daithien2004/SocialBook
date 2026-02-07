import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ICommentRepository } from '../../../domain/repositories/comment.repository.interface';
import { TargetId } from '../../../domain/value-objects/target-id.vo';
import { CommentTargetType } from '../../../domain/value-objects/comment-target-type.vo';
import { CommentId } from '../../../domain/value-objects/comment-id.vo';
import { GetCommentsCommand } from './get-comments.command';

@Injectable()
export class GetCommentsUseCase {
    private readonly logger = new Logger(GetCommentsUseCase.name);

    constructor(
        private readonly commentRepository: ICommentRepository
    ) {}

    async execute(command: GetCommentsCommand) {
        try {
            // Validate target
            const targetId = TargetId.create(command.targetId);
            const targetType = CommentTargetType.create(command.targetType);

            // Handle parent ID
            let parentId: CommentId | null = null;
            if (command.parentId) {
                parentId = CommentId.create(command.parentId);
            }

            // Set up pagination
            const pagination = {
                page: command.page || 1,
                limit: command.limit || 10,
                cursor: command.cursor
            };

            // Set up sorting
            const sort = {
                sortBy: command.sortBy || 'createdAt',
                order: command.order || 'desc'
            };

            // Get comments based on whether we want top-level or replies
            let result;
            if (parentId) {
                result = await this.commentRepository.findByParent(parentId, pagination, sort);
            } else {
                result = await this.commentRepository.findTopLevel(targetId, targetType, pagination, sort);
            }

            this.logger.log(`Retrieved ${result.data.length} comments for target ${command.targetId}`);

            return result;
        } catch (error) {
            this.logger.error(`Failed to get comments for target ${command.targetId}`, error);
            throw error;
        }
    }
}
