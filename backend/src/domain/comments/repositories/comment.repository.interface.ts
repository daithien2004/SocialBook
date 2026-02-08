import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { Comment } from '../entities/comment.entity';
import { CommentId } from '../value-objects/comment-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { CommentTargetType } from '../value-objects/comment-target-type.vo';

export interface CommentFilter {
    userId?: string;
    targetType?: 'book' | 'chapter' | 'post' | 'author';
    targetId?: string;
    parentId?: string;
    isFlagged?: boolean;
    moderationStatus?: 'pending' | 'approved' | 'rejected';
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface PaginationOptions {
    page: number;
    limit: number;
    cursor?: string;
}

export interface SortOptions {
    sortBy?: 'createdAt' | 'updatedAt' | 'likesCount';
    order?: 'asc' | 'desc';
}

export interface CommentReplies {
    comment: Comment;
    replies: Comment[];
    totalReplies: number;
}

export abstract class ICommentRepository {
    abstract findById(id: CommentId): Promise<Comment | null>;
    abstract findByTarget(
        targetId: TargetId,
        targetType: CommentTargetType,
        parentId?: CommentId | null,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Comment>>;
    abstract findByUser(
        userId: UserId,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Comment>>;
    abstract findByParent(
        parentId: CommentId,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Comment>>;
    abstract findTopLevel(
        targetId: TargetId,
        targetType: CommentTargetType,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Comment>>;
    
    abstract save(comment: Comment): Promise<void>;
    abstract delete(id: CommentId): Promise<void>;
    abstract softDelete(id: CommentId): Promise<void>;
    
    abstract existsByUserAndTarget(
        userId: UserId,
        targetId: TargetId,
        targetType: CommentTargetType,
        content?: string
    ): Promise<boolean>;
    
    abstract countByTarget(
        targetId: TargetId,
        targetType: CommentTargetType,
        parentId?: CommentId | null
    ): Promise<number>;
    abstract countByUser(userId: UserId): Promise<number>;
    abstract countByModerationStatus(status: 'pending' | 'approved' | 'rejected'): Promise<number>;
    abstract countFlagged(): Promise<number>;
    
    abstract findFlagged(pagination?: PaginationOptions): Promise<PaginatedResult<Comment>>;
    abstract findPendingModeration(pagination?: PaginationOptions): Promise<PaginatedResult<Comment>>;
    abstract findRejected(pagination?: PaginationOptions): Promise<PaginatedResult<Comment>>;
    
    abstract search(filter: CommentFilter, pagination?: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<Comment>>;
    
    abstract getRepliesTree(
        targetId: TargetId,
        targetType: CommentTargetType,
        maxDepth?: number
    ): Promise<CommentReplies[]>;
    
    abstract updateLikesCount(id: CommentId, increment: boolean): Promise<void>;
    abstract updateModerationStatus(id: CommentId, status: 'pending' | 'approved' | 'rejected', reason?: string): Promise<void>;
    abstract flagComment(id: CommentId, reason: string): Promise<void>;
    abstract unflagComment(id: CommentId): Promise<void>;
    
    abstract getRecentComments(pagination?: PaginationOptions): Promise<PaginatedResult<Comment>>;
    abstract getPopularComments(pagination?: PaginationOptions): Promise<PaginatedResult<Comment>>;
    
    abstract batchDelete(ids: CommentId[]): Promise<void>;
    abstract batchModerate(ids: CommentId[], status: 'approved' | 'rejected', reason?: string): Promise<void>;
    
    // Statistics
    abstract countTotal(): Promise<number>;
}
