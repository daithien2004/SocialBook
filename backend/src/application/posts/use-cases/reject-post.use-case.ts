import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { ErrorMessages } from '@/common/constants/error-messages';
import { RejectPostCommand } from './reject-post.command';

@Injectable()
export class RejectPostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RejectPostCommand) {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.POST_NOT_FOUND);

    await this.postRepository.delete(command.postId);
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

    return { success: true, message: 'Post rejected and deleted' };
  }
}
