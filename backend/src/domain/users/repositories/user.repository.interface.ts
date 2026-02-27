import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { User } from '../entities/user.entity';
import { UserEmail } from '../value-objects/user-email.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface UserFilter {
    username?: string;
    email?: string;
    roleId?: string;
    isBanned?: boolean;
    isVerified?: boolean;
}

export interface UserPaginationOptions {
    page: number;
    limit: number;
}

export abstract class IUserRepository {
    abstract findById(id: UserId): Promise<User | null>;
    abstract findByEmail(email: UserEmail): Promise<User | null>;
    abstract findByUsername(username: string): Promise<User | null>;

    abstract findAll(
        filter: UserFilter,
        pagination: UserPaginationOptions
    ): Promise<PaginatedResult<User>>;

    abstract save(user: User): Promise<void>;
    abstract delete(id: UserId): Promise<void>;

    abstract existsByEmail(email: UserEmail, excludeId?: UserId): Promise<boolean>;
    abstract existsByUsername(username: string, excludeId?: UserId): Promise<boolean>;
    abstract existsById(id: UserId): Promise<boolean>;
    abstract findByIds(ids: UserId[]): Promise<User[]>;
    abstract updateOnboardingData(id: UserId, data: { onboardingId?: string; gamificationId?: string; onboardingCompleted?: boolean }): Promise<void>;

    // Statistics
    abstract countByDate(startDate: Date, endDate?: Date): Promise<number>;
    abstract countByProvider(): Promise<Map<string, number>>;
    abstract getGeographicDistribution(): Promise<Array<{ country: string; userCount: number }>>;
    abstract getGrowthMetrics(startDate: Date, groupBy: 'day' | 'month' | 'year'): Promise<Array<{ _id: string; count: number }>>;
}
