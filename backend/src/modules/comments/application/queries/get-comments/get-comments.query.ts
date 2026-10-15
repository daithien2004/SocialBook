import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import { PaginatedResult } from '@/shared/domain/pagination.types';
import { CommentReadModel } from '@/modules/comments/application/read-models/comment.read-model';

export class GetCommentsQuery extends Query<PaginatedResult<CommentReadModel>> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
    public readonly parentId?: string | null,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly sortBy?: 'createdAt' | 'updatedAt',
    public readonly order?: 'asc' | 'desc',
  ) {
    super();
  }
}
