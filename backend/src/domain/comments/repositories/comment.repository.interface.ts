import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/common/interfaces/pagination.interface';
import { Comment } from '../entities/comment.entity';
import { CommentModel } from '../read-models/comment-model';
import { CommentDepth } from '../value-objects/comment-depth.vo';
import { CommentId } from '../value-objects/comment-id.vo';
import { CommentTargetType } from '../value-objects/comment-target-type.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export type CommentSortField = 'createdAt' | 'updatedAt' | 'likesCount';

export interface ParentResolutionResult {
  effectiveParentId: string | null;
  level: CommentDepth;
}

export interface CommentFilter {
  userId?: string;
  viewerUserId?: string;
  targetType?: 'book' | 'chapter' | 'post' | 'author';
  targetId?: string;
  parentId?: string | null;
  isFlagged?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CommentReplies {
  comment: CommentModel;
  replies: CommentModel[];
  totalReplies: number;
}

export abstract class ICommentRepository {
  abstract findById(id: CommentId): Promise<Comment | null>;
  abstract findByTarget(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: CommentId | null,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>>;
  abstract findByUser(
    userId: UserId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>>;
  abstract findByParent(
    parentId: CommentId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>>;
  abstract findTopLevel(
    targetId: TargetId,
    targetType: CommentTargetType,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>>;

  abstract save(comment: Comment): Promise<void>;
  abstract delete(id: CommentId): Promise<void>;
  abstract softDelete(id: CommentId): Promise<void>;

  abstract existsByUserAndTarget(
    userId: UserId,
    targetId: TargetId,
    targetType: CommentTargetType,
    content?: string,
  ): Promise<boolean>;

  abstract countByTarget(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: CommentId | null,
  ): Promise<number>;
  abstract countByUser(userId: UserId): Promise<number>;
  abstract countByModerationStatus(
    status: 'pending' | 'approved' | 'rejected',
  ): Promise<number>;
  abstract countFlagged(): Promise<number>;

  abstract findFlagged(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>>;
  abstract findPendingModeration(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>>;
  abstract findRejected(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>>;

  abstract search(
    filter: CommentFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>>;

  abstract getRepliesTree(
    targetId: TargetId,
    targetType: CommentTargetType,
    maxDepth?: number,
  ): Promise<CommentReplies[]>;

  abstract updateLikesCount(id: CommentId, increment: boolean): Promise<void>;
  abstract updateModerationStatus(
    id: CommentId,
    status: 'pending' | 'approved' | 'rejected',
    reason?: string,
  ): Promise<void>;
  abstract flagComment(id: CommentId, reason: string): Promise<void>;
  abstract unflagComment(id: CommentId): Promise<void>;

  abstract getRecentComments(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>>;
  abstract getPopularComments(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>>;

  abstract batchDelete(ids: CommentId[]): Promise<void>;
  abstract batchModerate(
    ids: CommentId[],
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void>;

  abstract resolveParentId(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: string | null,
  ): Promise<ParentResolutionResult>;

  abstract countTotal(): Promise<number>;
}
