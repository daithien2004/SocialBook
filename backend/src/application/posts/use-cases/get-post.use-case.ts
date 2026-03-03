import { Injectable, NotFoundException } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { GetPostQuery } from './get-post.query';

@Injectable()
export class GetPostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) { }

  async execute(query: GetPostQuery): Promise<Post> {
    const post = await this.postRepository.findById(query.postId);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);
    return post;
  }
}
