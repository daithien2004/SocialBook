import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { UserGamification } from '../entities/user-gamification.entity';
import { UserGamificationId } from '../value-objects/user-gamification-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface UserGamificationFilter {
    minStreak?: number;
    maxStreak?: number;
    hasActiveStreak?: boolean;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export abstract class IUserGamificationRepository {
    abstract findById(id: UserGamificationId): Promise<UserGamification | null>;
    abstract findByUser(userId: UserId): Promise<UserGamification | null>;
    abstract findAll(
        filter: UserGamificationFilter,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<UserGamification>>;
    
    abstract save(gamification: UserGamification): Promise<void>;
    abstract delete(id: UserGamificationId): Promise<void>;
    
    abstract getTopUsersByStreak(limit: number): Promise<UserGamification[]>;
    abstract getTopUsersByXP(limit: number): Promise<UserGamification[]>;
    abstract getActiveStreaksCount(): Promise<number>;
    abstract getTotalXPDistributed(): Promise<number>;
    
    abstract existsByUser(userId: UserId): Promise<boolean>;
    abstract countActiveStreaks(): Promise<number>;
    abstract countUsersWithStreak(): Promise<number>;
}
