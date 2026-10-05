import { CursorPaginatedResult } from '@/shared/domain/pagination.types';
import { Post } from '@/domain/posts/entities/post.entity';
import { Query } from '@nestjs/cqrs';
export class GetPostsQuery extends Query<CursorPaginatedResult<Post>> {
  constructor(
    public readonly limit: number = 10,
    public readonly cursor?: string,
    public readonly viewerUserId?: string,
  ) {
    super();
  }
}
