import { PaginatedResult } from '@/shared/domain/pagination.types';
import { Post } from '@/domain/posts/entities/post.entity';
import { Query } from '@nestjs/cqrs';
export class GetFlaggedPostsQuery extends Query<PaginatedResult<Post>> {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly reason?: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly sortBy?: 'newest' | 'oldest' | 'violations',
  ) {
    super();
  }
}
