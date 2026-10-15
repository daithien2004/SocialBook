import { PaginatedResult } from '@/shared/domain/pagination.types';
import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PostResult } from '@/modules/posts/application/posts/post.result';
export class GetFlaggedPostsQuery extends Query<PaginatedResult<PostResult>> {
  constructor(
    public readonly actor: Actor,
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
