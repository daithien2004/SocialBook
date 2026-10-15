import { CursorPaginatedResult } from '@/shared/domain/pagination.types';
import type { PostResult } from '@/modules/posts/application/posts/post.result';
import type { Actor } from '@/shared/casl/actor';
import { Query } from '@nestjs/cqrs';
export class GetPostsQuery extends Query<CursorPaginatedResult<PostResult>> {
  constructor(
    public readonly actor: Actor,
    public readonly limit: number = 10,
    public readonly cursor?: string,
  ) {
    super();
  }
}
