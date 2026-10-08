import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { ICommentRepository } from '@/modules/comments/domain/repositories/comment.repository.interface';
import { CommentId } from '@/modules/comments/domain/value-objects/comment-id.vo';
import { DeleteCommentCommand } from './delete-comment.command';
import { CommentErrorMessages } from '@/modules/comments/application/error-messages';

import { Action, Subject } from '@socialbook/shared';
import { subject } from '@casl/ability';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand> {
  private readonly logger = new Logger(DeleteCommentHandler.name);

  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(command: DeleteCommentCommand) {
    try {
      const commentId = CommentId.create(command.id);

      // Find the comment
      const comment = await this.commentRepository.findById(commentId);
      if (!comment) {
        throw new NotFoundDomainException(
          CommentErrorMessages.COMMENT_NOT_FOUND,
        );
      }

      // Check if user can delete this comment via CASL
      if (
        !command.ability.can(
          Action.Delete,
          subject(Subject.Comment, { userId: comment.userId.toString() }),
        )
      ) {
        throw new ForbiddenDomainException('You cannot delete this comment');
      }

      // Delete the comment
      await this.commentRepository.delete(commentId);

      this.logger.log(
        `Comment deleted successfully: ${comment.id.toString()} by user ${command.userId}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete comment ${command.id} by user ${command.userId}`,
        error,
      );
      throw error;
    }
  }
}
