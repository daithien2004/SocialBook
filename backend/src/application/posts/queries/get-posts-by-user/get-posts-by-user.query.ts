import { Post } from '@/domain/posts/entities/post.entity';
import { CursorPaginatedResult } from '@/shared/domain/pagination.types';
import { Query } from '@nestjs/cqrs';
export class GetPostsByUserQuery extends Query<CursorPaginatedResult<Post>> {
  constructor(
    public readonly userId: string,
    public readonly limit: number = 10,
    public readonly cursor?: string,
    public readonly viewerUserId?: string,
  ) {
    super();
  }
}
