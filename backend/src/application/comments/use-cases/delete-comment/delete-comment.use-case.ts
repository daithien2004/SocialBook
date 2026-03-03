import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { DeleteCommentCommand } from './delete-comment.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class DeleteCommentUseCase {
    private readonly logger = new Logger(DeleteCommentUseCase.name);

    constructor(
        private readonly commentRepository: ICommentRepository
    ) {}

    async execute(command: DeleteCommentCommand) {
        try {
            const commentId = CommentId.create(command.id);
            
            // Find the comment
            const comment = await this.commentRepository.findById(commentId);
            if (!comment) {
                throw new NotFoundException(ErrorMessages.COMMENT_NOT_FOUND);
            }

            // Check if user can delete this comment
            const canDelete = command.isAdmin || comment.canBeDeleted(command.userId);
            if (!canDelete) {
                throw new ForbiddenException('You cannot delete this comment');
            }

            // Delete the comment
            await this.commentRepository.delete(commentId);

            this.logger.log(`Comment deleted successfully: ${comment.id.toString()} by user ${command.userId}`);

            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to delete comment ${command.id} by user ${command.userId}`, error);
            throw error;
        }
    }
}


