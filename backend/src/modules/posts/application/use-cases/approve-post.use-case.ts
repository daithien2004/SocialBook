import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class ApprovePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(id: string) {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    if (!post.isFlagged) {
        throw new BadRequestException('Post is not flagged');
    }

    post.approve();
    await this.postRepository.update(post);

    return { success: true, message: 'Post approved successfully' };
  }
}
