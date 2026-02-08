import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { UpdateCommentCommand } from './update-comment.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class UpdateCommentUseCase {
    private readonly logger = new Logger(UpdateCommentUseCase.name);

    constructor(
        private readonly commentRepository: ICommentRepository
    ) {}

    async execute(command: UpdateCommentCommand) {
        try {
            const commentId = CommentId.create(command.id);
            
            // Find the comment
            const comment = await this.commentRepository.findById(commentId);
            if (!comment) {
                throw new NotFoundException(ErrorMessages.COMMENT_NOT_FOUND);
            }

            // Check if user can edit this comment
            if (!comment.canBeEdited(command.userId)) {
                throw new ForbiddenException('You cannot edit this comment');
            }

            // Update the content
            comment.updateContent(command.content);

            // Save the updated comment
            await this.commentRepository.save(comment);

            this.logger.log(`Comment updated successfully: ${comment.id.toString()} by user ${command.userId}`);

            return comment;
        } catch (error) {
            this.logger.error(`Failed to update comment ${command.id} by user ${command.userId}`, error);
            throw error;
        }
    }
}


