import { Injectable, Logger } from '@nestjs/common';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { TargetId } from '@/domain/comments/value-objects/target-id.vo';
import { CommentTargetType } from '@/domain/comments/value-objects/comment-target-type.vo';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';


export class GetCommentCountRequest {
    constructor(
        public readonly targetId: string,
        public readonly targetType: 'book' | 'chapter' | 'post' | 'author',
        public readonly parentId?: string | null,
    ) { }
}

export interface GetCommentCountResponse {
    count: number;
}

@Injectable()
export class GetCommentCountUseCase {
    private readonly logger = new Logger(GetCommentCountUseCase.name);

    constructor(
        private readonly commentRepository: ICommentRepository
    ) { }

    async execute(query: GetCommentCountRequest): Promise<GetCommentCountResponse> {
        try {
            const targetId = TargetId.create(query.targetId);
            const targetType = CommentTargetType.create(query.targetType);

            let parentId: CommentId | null = null;
            if (query.parentId) {
                parentId = CommentId.create(query.parentId);
            }

            const count = await this.commentRepository.countByTarget(targetId, targetType, parentId);

            this.logger.log(`Comment count for target ${query.targetId}: ${count}`);

            return { count };
        } catch (error) {
            this.logger.error(`Failed to get comment count for target ${query.targetId}`, error);
            throw error;
        }
    }
}
