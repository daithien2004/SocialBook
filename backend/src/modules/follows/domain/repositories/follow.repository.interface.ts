import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';
import { Follow } from '../entities/follow.entity';
import { FollowId } from '../value-objects/follow-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { FollowStatus } from '../value-objects/follow-status.vo';

export interface FollowFilter {
    userId?: string;
    targetId?: string;
    status?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface SortOptions {
    sortBy?: 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
}

export interface FollowStatusResult {
    userId: string;
    targetId: string;
    isFollowing: boolean;
    isOwner: boolean;
    followId?: string;
}

export interface FollowStats {
    totalFollowing: number;
    totalFollowers: number;
    followingCount: number;
    followersCount: number;
    recentFollows: Follow[];
}

export abstract class IFollowRepository {
    abstract findById(id: FollowId): Promise<Follow | null>;
    abstract findByUser(
        userId: UserId,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Follow>>;
    abstract findByTarget(
        targetId: TargetId,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Follow>>;
    abstract findAll(
        filter: FollowFilter,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Follow>>;
    
    abstract save(follow: Follow): Promise<void>;
    abstract delete(id: FollowId): Promise<void>;
    abstract softDelete(id: FollowId): Promise<void>;
    
    abstract exists(userId: UserId, targetId: TargetId): Promise<Follow | null>;
    abstract getFollowStatus(userId: UserId, targetId: TargetId): Promise<FollowStatusResult>;
    
    abstract countFollowing(userId: UserId): Promise<number>;
    abstract countFollowers(targetId: TargetId): Promise<number>;
    abstract countActiveFollows(): Promise<number>;
    abstract countInactiveFollows(): Promise<number>;
    
    abstract getFollowingIds(userId: UserId): Promise<string[]>;
    abstract getFollowerIds(targetId: TargetId): Promise<string[]>;
    
    abstract findMutualFollows(userId1: UserId, userId2: UserId): Promise<Follow[]>;
    abstract getFollowStats(userId: UserId): Promise<FollowStats>;
    
    abstract batchDelete(ids: FollowId[]): Promise<void>;
    abstract batchUpdateStatus(ids: FollowId[], status: boolean): Promise<void>;
    
    abstract getRecentFollows(pagination?: PaginationOptions): Promise<PaginatedResult<Follow>>;
    abstract getPopularFollows(pagination?: PaginationOptions): Promise<PaginatedResult<Follow>>;
    
    abstract followUser(userId: UserId, targetId: TargetId): Promise<Follow>;
    abstract unfollowUser(userId: UserId, targetId: TargetId): Promise<Follow>;
    abstract toggleFollow(userId: UserId, targetId: TargetId): Promise<Follow>;
}
