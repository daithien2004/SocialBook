import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { ForbiddenError, subject } from '@casl/ability';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { ICommentRepository } from '@/modules/comments/domain/repositories/comment.repository.interface';
import { CommentId } from '@/modules/comments/domain/value-objects/comment-id.vo';
import { DeleteCommentCommand } from './delete-comment.command';
import { CommentErrorMessages } from '@/modules/comments/application/error-messages';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand> {
  constructor(private readonly commentRepository: ICommentRepository) {}

  @Transactional()
  async execute(command: DeleteCommentCommand): Promise<void> {
    const commentId = CommentId.create(command.id);
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundDomainException(CommentErrorMessages.COMMENT_NOT_FOUND);
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'delete',
      subject('Comment', {
        userId: comment.userId.toString(),
        moderationStatus: comment.moderationStatus.toString(),
        isDeleted: false,
      }),
    );
    await this.commentRepository.delete(commentId);
  }
}
