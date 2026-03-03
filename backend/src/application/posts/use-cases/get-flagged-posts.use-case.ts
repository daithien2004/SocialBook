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
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    return this.postRepository.findFlagged(skip, limit);
  }
}
