import type { AppAbility } from '@/shared/casl/app-ability';
import type {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import type { CommentReadModel } from '../read-models/comment.read-model';

export interface CommentListFilter {
  targetId: string;
  parentId?: string | null;
}

export interface CommentCountFilter {
  targetId: string;
  targetType: string;
  parentId?: string | null;
}

export abstract class CommentReadRepository {
  abstract search(
    ability: AppAbility,
    filter: CommentListFilter,
    pagination: PaginationOptions,
    sort: SortOptions<'createdAt' | 'updatedAt'>,
    viewerUserId: string,
  ): Promise<PaginatedResult<CommentReadModel>>;

  abstract count(
    ability: AppAbility,
    filter: CommentCountFilter,
  ): Promise<number>;
}
