import { Post } from '../entities/post.entity';

export interface FindAllOptions {
    skip: number;
    limit: number;
    userId?: string;
    isFlagged?: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
}

export abstract class IPostRepository {
    abstract create(post: Post): Promise<Post>;
    abstract update(post: Post): Promise<Post>;
    abstract findById(id: string): Promise<Post | null>;
    abstract findAll(options: FindAllOptions): Promise<PaginatedResult<Post>>;
    abstract delete(id: string): Promise<void>; // Hard delete
    abstract softDelete(id: string): Promise<void>; // Soft delete
    
    // Admin specific
    abstract findFlagged(skip: number, limit: number): Promise<PaginatedResult<Post>>;
    
    // User profile specific
    abstract countByUser(userId: string): Promise<number>;
    
    // Helper checks
    abstract exists(id: string): Promise<boolean>;

    // Statistics
    abstract countTotal(): Promise<number>;
    abstract countActive(): Promise<number>;
    abstract countDeleted(): Promise<number>;
    abstract getGrowthMetrics(startDate: Date, groupBy: string): Promise<Array<{ _id: string; count: number }>>;
}
