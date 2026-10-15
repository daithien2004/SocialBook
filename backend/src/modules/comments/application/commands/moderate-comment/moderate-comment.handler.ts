import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { ICommentRepository } from '@/modules/comments/domain/repositories/comment.repository.interface';
import { CommentId } from '@/modules/comments/domain/value-objects/comment-id.vo';
import { ModerateCommentCommand } from './moderate-comment.command';
import { CommentErrorMessages } from '@/modules/comments/application/error-messages';
import { ForbiddenError, subject } from '@casl/ability';

@CommandHandler(ModerateCommentCommand)
export class ModerateCommentHandler implements ICommandHandler<ModerateCommentCommand> {
  constructor(private readonly commentRepository: ICommentRepository) {}

  @Transactional()
  async execute(command: ModerateCommentCommand): Promise<void> {
    const commentId = CommentId.create(command.id);
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundDomainException(CommentErrorMessages.COMMENT_NOT_FOUND);
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'manage',
      subject('Comment', {
        userId: comment.userId.toString(),
        moderationStatus: comment.moderationStatus.toString(),
        isDeleted: false,
      }),
    );

    if (command.status === 'approved') comment.approve();
    else comment.reject(command.reason ?? '');
    await this.commentRepository.save(comment);
  }
}
