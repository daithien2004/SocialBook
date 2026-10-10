import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { Comment } from '../entities/comment.entity';
import { CommentModel } from '../read-models/comment-model';
import { CommentDepth } from '../value-objects/comment-depth.vo';
import { CommentId } from '../value-objects/comment-id.vo';
import { CommentTargetType } from '../value-objects/comment-target-type.vo';
import { TargetId } from '../value-objects/target-id.vo';

export interface ParentResolutionResult {
  effectiveParentId: string | null;
  level: CommentDepth;
}

export interface CommentFilter {
  targetId: string;
  viewerUserId?: string;
  parentId?: string | null;
}

export abstract class ICommentRepository {
  abstract findById(id: CommentId): Promise<Comment | null>;

  abstract save(comment: Comment): Promise<void>;
  abstract delete(id: CommentId): Promise<void>;

  abstract countByTarget(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: CommentId | null,
  ): Promise<number>;
  abstract search(
    filter: CommentFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>>;

  abstract updateModerationStatus(
    id: CommentId,
    status: 'pending' | 'approved' | 'rejected',
    reason?: string,
  ): Promise<void>;
  abstract resolveParentId(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: string | null,
  ): Promise<ParentResolutionResult>;

  abstract countTotal(): Promise<number>;
}
