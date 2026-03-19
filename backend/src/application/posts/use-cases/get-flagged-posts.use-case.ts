import { Injectable } from '@nestjs/common';
import { IPostRepository, PaginatedResult } from '@/domain/posts/repositories/post.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { GetFlaggedPostsQuery } from './get-flagged-posts.query';

@Injectable()
export class GetFlaggedPostsUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) { }

  async execute(query: GetFlaggedPostsQuery): Promise<PaginatedResult<Post>> {
    return this.postRepository.findFlagged({
      page: query.page,
      limit: query.limit,
    });
  }
}
