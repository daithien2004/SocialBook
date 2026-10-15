import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { ApprovePostCommand } from './approve-post.command';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(ApprovePostCommand)
export class ApprovePostHandler implements ICommandHandler<
  ApprovePostCommand,
  void
> {
  constructor(private readonly postRepository: IPostRepository) {}

  @Transactional()
  async execute(command: ApprovePostCommand): Promise<void> {
    if (!command.actor.ability.can('manage', 'Post')) {
      throw new ForbiddenDomainException(
        PostErrorMessages.POST_MODERATION_FORBIDDEN,
      );
    }
    const post = await this.postRepository.findById(command.postId);
    if (!post)
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);

    if (!post.isFlagged) {
      throw new BadRequestDomainException('Post is not flagged');
    }

    post.approve();
    await this.postRepository.update(post);
  }
}
