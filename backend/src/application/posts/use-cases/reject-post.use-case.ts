import { Injectable, NotFoundException } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class RejectPostUseCase {
    constructor(
        private readonly postRepository: IPostRepository
    ) {}

  async execute(id: string) {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    await this.postRepository.delete(id); // Hard delete as per original service

    return { success: true, message: 'Post rejected and deleted' };
  }
}

