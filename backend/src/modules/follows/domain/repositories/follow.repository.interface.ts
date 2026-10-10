import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { Follow } from '../entities/follow.entity';
import { TargetId } from '../value-objects/target-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface FollowFilter {
  userId?: string;
  targetId?: string;
  status?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface FollowStatusResult {
  userId: string;
  targetId: string;
  isFollowing: boolean;
  isOwner: boolean;
  followId?: string;
}

export interface FollowWithUserInfo {
  id: string;
  userId: string;
  targetId: string;
  status: boolean;
  username?: string;
  image?: string;
  postCount?: number;
  readingListCount?: number;
  followersCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedFollowsWithUserInfo {
  data: FollowWithUserInfo[];
  meta: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export abstract class IFollowRepository {
  abstract findByUser(
    userId: UserId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<Follow>>;
  abstract findByUserWithUserInfo(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedFollowsWithUserInfo>;
  abstract findByTargetWithUserInfo(
    targetId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedFollowsWithUserInfo>;
  abstract findByTarget(
    targetId: TargetId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<Follow>>;
  abstract findAll(
    filter: FollowFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<Follow>>;

  abstract save(follow: Follow): Promise<void>;

  abstract exists(userId: UserId, targetId: TargetId): Promise<Follow | null>;
  abstract getFollowStatus(
    userId: UserId,
    targetId: TargetId,
  ): Promise<FollowStatusResult>;

  abstract countFollowers(targetId: TargetId): Promise<number>;
}
