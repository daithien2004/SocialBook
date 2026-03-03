import { Injectable, NotFoundException } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { ErrorMessages } from '@/common/constants/error-messages';
import { RejectPostCommand } from './reject-post.command';

@Injectable()
export class RejectPostUseCase {
  constructor(
    private readonly postRepository: IPostRepository
  ) { }

  async execute(command: RejectPostCommand) {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    await this.postRepository.delete(command.postId);

    return { success: true, message: 'Post rejected and deleted' };
  }
}
