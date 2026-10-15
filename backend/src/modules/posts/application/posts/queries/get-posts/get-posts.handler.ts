import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CursorPaginatedResult } from '@/shared/domain/pagination.types';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { GetPostsQuery } from './get-posts.query';
import { PostResultMapper } from '@/modules/posts/application/posts/post.result';
import type { PostResult } from '@/modules/posts/application/posts/post.result';

@QueryHandler(GetPostsQuery)
export class GetPostsHandler implements IQueryHandler<
  GetPostsQuery,
  CursorPaginatedResult<PostResult>
> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(
    query: GetPostsQuery,
  ): Promise<CursorPaginatedResult<PostResult>> {
    const page = await this.postRepository.findAll({
      limit: query.limit,
      cursor: query.cursor,
      viewerUserId:
        query.actor.userId === 'anonymous' ? undefined : query.actor.userId,
    });
    return { ...page, data: PostResultMapper.fromDomainArray(page.data) };
  }
}
