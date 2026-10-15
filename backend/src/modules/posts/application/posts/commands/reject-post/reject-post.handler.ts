import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserId } from '@/modules/users/domain/public-api';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { RejectPostCommand } from './reject-post.command';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(RejectPostCommand)
export class RejectPostHandler implements ICommandHandler<
  RejectPostCommand,
  void
> {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  @Transactional()
  async execute(command: RejectPostCommand): Promise<void> {
    if (!command.actor.ability.can('manage', 'Post')) {
      throw new ForbiddenDomainException(
        PostErrorMessages.POST_MODERATION_FORBIDDEN,
      );
    }
    const post = await this.postRepository.findById(command.postId);
    if (!post)
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);

    await this.postRepository.delete(command.postId, post.loadedVersion);
    // vi phạm 10 lần là tự động khóa acc
    const user = await this.userRepository.findById(
      UserId.create(post.userId.toString()),
    );
    if (user) {
      user.incrementViolationCount();
      if (user.violationCount >= 10 && !user.isBanned) {
        user.ban();
      }
      await this.userRepository.save(user);
    }
  }
}
