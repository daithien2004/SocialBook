import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { ModerateCommentCommand } from './moderate-comment.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class ModerateCommentUseCase {
    private readonly logger = new Logger(ModerateCommentUseCase.name);

    constructor(
        private readonly commentRepository: ICommentRepository
    ) {}

    async execute(command: ModerateCommentCommand) {
        try {
            const commentId = CommentId.create(command.id);
            
            // Find the comment
            const comment = await this.commentRepository.findById(commentId);
            if (!comment) {
                throw new NotFoundException(ErrorMessages.COMMENT_NOT_FOUND);
            }

            // Update moderation status
            await this.commentRepository.updateModerationStatus(
                commentId,
                command.status,
                command.reason
            );

            this.logger.log(`Comment moderated successfully: ${comment.id.toString()} to ${command.status}`);

            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to moderate comment ${command.id}`, error);
            throw error;
        }
    }
}


