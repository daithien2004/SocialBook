import { Injectable, Logger } from '@nestjs/common';
import { ICommentRepository, CommentFilter } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { GetCommentsQuery } from './get-comments.query';

@Injectable()
export class GetCommentsUseCase {
    private readonly logger = new Logger(GetCommentsUseCase.name);

    constructor(
        private readonly commentRepository: ICommentRepository
    ) { }

    async execute(query: GetCommentsQuery) {
        try {
            let parentId: CommentId | null = null;
            if (query.parentId) {
                parentId = CommentId.create(query.parentId);
            }

            const pagination = {
                page: query.page || 1,
                limit: query.limit || 10,
                cursor: query.cursor
            };

            const sort = {
                sortBy: query.sortBy || 'createdAt',
                order: query.order || 'desc'
            };

            let result;
            if (parentId) {
                result = await this.commentRepository.findByParent(parentId, pagination, sort);
            } else {
                const filter: CommentFilter = {
                    targetId: query.targetId,
                };
                result = await this.commentRepository.search(filter, pagination, sort);
            }

            this.logger.log(`Retrieved ${result.data.length} comments for target ${query.targetId}`);

            return result;
        } catch (error) {
            this.logger.error(`Failed to get comments for target ${query.targetId}`, error);
            throw error;
        }
    }
}
