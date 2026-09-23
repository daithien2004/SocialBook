import { Injectable } from '@nestjs/common';
import { ICommentRepository } from '@/domain/reading-room-interactions/repositories/comment.repository.interface';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { DeleteCommentCommand } from './delete-comment.command';
import { Action, Subject } from '@socialbook/shared';
import { subject } from '@casl/ability';

@Injectable()
export class DeleteCommentUseCase {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findById(command.commentId);
    if (!comment) {
      throw new NotFoundDomainException('Không tìm thấy bình luận');
    }

    if (
      !command.ability.can(Action.Delete, subject(Subject.RoomComment, comment))
    ) {
      throw new ForbiddenDomainException(
        'You can only delete your own comments',
      );
    }

    await this.commentRepository.delete(command.commentId);
  }
}
