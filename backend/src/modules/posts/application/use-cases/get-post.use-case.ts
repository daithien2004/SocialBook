import { Injectable, NotFoundException } from '@nestjs/common';
import { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/entities/post.entity';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class GetPostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);
    return post;
  }
}
