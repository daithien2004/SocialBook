import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { Post } from '@/modules/posts/domain/posts/entities/post.entity';
import { PaginatedResult } from '@/shared/domain/pagination.types';
import { GetFlaggedPostsQuery } from './get-flagged-posts.query';

@QueryHandler(GetFlaggedPostsQuery)
export class GetFlaggedPostsHandler implements IQueryHandler<
  GetFlaggedPostsQuery,
  PaginatedResult<Post>
> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(query: GetFlaggedPostsQuery): Promise<PaginatedResult<Post>> {
    return this.postRepository.findFlagged({
      page: query.page,
      limit: query.limit,
      reason: query.reason,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy,
    });
  }
}
