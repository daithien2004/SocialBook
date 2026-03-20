import { Injectable } from '@nestjs/common';
import { NotFoundDomainException, BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { ErrorMessages } from '@/common/constants/error-messages';
import { ApprovePostCommand } from './approve-post.command';

@Injectable()
export class ApprovePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) { }

  async execute(command: ApprovePostCommand) {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.POST_NOT_FOUND);

    if (!post.isFlagged) {
      throw new BadRequestDomainException('Post is not flagged');
    }

    post.approve();
    await this.postRepository.update(post);

    return { success: true, message: 'Post approved successfully' };
  }
}
