import { CursorPaginatedResult } from '@/common/interfaces/pagination.interface';
import { Post } from '../entities/post.entity';

export interface FindAllOptions {
  limit: number;
  userId?: string;
  viewerUserId?: string;
  isFlagged?: boolean;
  cursor?: string;
}

export interface FindFlaggedOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export abstract class IPostRepository {
  abstract create(post: Post): Promise<Post>;
  abstract update(post: Post): Promise<Post>;
  abstract findById(id: string, viewerUserId?: string): Promise<Post | null>;
  abstract findAll(
    options: FindAllOptions,
  ): Promise<CursorPaginatedResult<Post>>;
  abstract delete(id: string): Promise<void>;
  abstract softDelete(id: string): Promise<void>;

  // Admin specific
  abstract findFlagged(
    options: FindFlaggedOptions,
  ): Promise<PaginatedResult<Post>>;

  // User profile specific
  abstract countByUser(userId: string): Promise<number>;

  // Helper checks
  abstract exists(id: string): Promise<boolean>;

  // Statistics
  abstract countTotal(): Promise<number>;
  abstract countActive(): Promise<number>;
  abstract countDeleted(): Promise<number>;
  abstract getGrowthMetrics(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<Array<{ _id: string; count: number }>>;
}
