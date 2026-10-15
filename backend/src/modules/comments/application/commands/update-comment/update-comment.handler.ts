import { Comment } from '@/modules/comments/domain/entities/comment.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ForbiddenError, subject } from '@casl/ability';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { ICommentRepository } from '@/modules/comments/domain/repositories/comment.repository.interface';
import { CommentId } from '@/modules/comments/domain/value-objects/comment-id.vo';
import { UpdateCommentCommand } from './update-comment.command';
import { CommentErrorMessages } from '@/modules/comments/application/error-messages';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand> {
  private readonly logger = new Logger(UpdateCommentHandler.name);

  constructor(private readonly commentRepository: ICommentRepository) {}

  @Transactional()
  async execute(command: UpdateCommentCommand): Promise<Comment> {
    try {
      const commentId = CommentId.create(command.id);

      // Find the comment
      const comment = await this.commentRepository.findById(commentId);
      if (!comment) {
        throw new NotFoundDomainException(
          CommentErrorMessages.COMMENT_NOT_FOUND,
        );
      }

      // Check if user can edit this comment via CASL
      ForbiddenError.from(command.actor.ability).throwUnlessCan(
        'update',
        subject('Comment', {
          userId: comment.userId.toString(),
          moderationStatus: comment.moderationStatus.toString(),
          isDeleted: false,
        }),
      );

      // Update the content
      comment.updateContent(command.content);

      // Save the updated comment
      await this.commentRepository.save(comment);

      this.logger.log(
        `Comment updated successfully: ${comment.id.toString()} by user ${command.actor.userId}`,
      );

      return comment;
    } catch (error) {
      this.logger.error(
        `Failed to update comment ${command.id} by user ${command.actor.userId}`,
        error,
      );
      throw error;
    }
  }
}
