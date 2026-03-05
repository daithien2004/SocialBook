import { CursorPaginatedResult } from '@/common/interfaces/pagination.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { Injectable } from '@nestjs/common';
import { GetPostsQuery } from './get-posts.query';

@Injectable()
export class GetPostsUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) { }

  async execute(query: GetPostsQuery): Promise<CursorPaginatedResult<Post>> {
    return this.postRepository.findAll({
      limit: query.limit,
      cursor: query.cursor,
    });
  }
}
