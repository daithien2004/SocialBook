import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { DeletePostCommand } from './delete-post.command';

import { subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<
  DeletePostCommand,
  void
> {
  constructor(private readonly postRepository: IPostRepository) {}

  @Transactional()
  async execute(command: DeletePostCommand): Promise<void> {
    const post = await this.postRepository.findById(command.postId);
    if (!post)
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);

    if (
      !command.actor.ability.can(
        'delete',
        subject('Post', {
          id: post.id,
          userId: post.userId,
          isDeleted: post.isDeleted,
          isFlagged: post.isFlagged,
        }),
      )
    ) {
      throw new ForbiddenDomainException(
        PostErrorMessages.POST_DELETE_FORBIDDEN,
      );
    }

    if (command.isHardDelete) {
      await this.postRepository.delete(command.postId, post.loadedVersion);
    } else {
      await this.postRepository.softDelete(command.postId, post.loadedVersion);
    }
  }
}
