import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserId } from '@/modules/users/domain/public-api';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { RejectPostCommand } from './reject-post.command';

@CommandHandler(RejectPostCommand)
export class RejectPostHandler implements ICommandHandler<
  RejectPostCommand,
  { success: boolean; message: string }
> {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RejectPostCommand) {
    const post = await this.postRepository.findById(command.postId);
    if (!post)
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);

    await this.postRepository.delete(command.postId);
    // vi pháº¡m 10 láº§n lÃ  tá»± Ä‘á»™ng khÃ³a acc
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

    return { success: true, message: 'Post rejected and deleted' };
  }
}
