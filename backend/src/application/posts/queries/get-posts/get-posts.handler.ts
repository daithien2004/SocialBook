import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CursorPaginatedResult } from '@/common/interfaces/pagination.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { GetPostsQuery } from './get-posts.query';

@QueryHandler(GetPostsQuery)
export class GetPostsHandler implements IQueryHandler<GetPostsQuery, CursorPaginatedResult<Post>> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(query: GetPostsQuery): Promise<CursorPaginatedResult<Post>> {
    return this.postRepository.findAll({
      limit: query.limit,
      cursor: query.cursor,
      viewerUserId: query.viewerUserId,
    });
  }
}
