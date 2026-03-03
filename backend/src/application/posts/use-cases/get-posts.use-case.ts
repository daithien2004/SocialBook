import { Injectable } from '@nestjs/common';
import { IPostRepository, PaginatedResult } from '@/domain/posts/repositories/post.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { GetPostsQuery } from './get-posts.query';

@Injectable()
export class GetPostsUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) { }

  async execute(query: GetPostsQuery): Promise<PaginatedResult<Post>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    return this.postRepository.findAll({ skip, limit });
  }
}
