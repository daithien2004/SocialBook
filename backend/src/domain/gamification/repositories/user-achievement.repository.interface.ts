import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { UserAchievement } from '../entities/user-achievement.entity';
import { UserAchievementId } from '../entities/user-achievement.entity';
import { UserId } from '../value-objects/user-id.vo';
import { AchievementId } from '../value-objects/achievement-id.vo';

export interface UserAchievementFilter {
    userId?: string;
    achievementId?: string;
    isUnlocked?: boolean;
    minProgress?: number;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export abstract class IUserAchievementRepository {
    abstract findById(id: UserAchievementId): Promise<UserAchievement | null>;
    abstract findByUser(
        userId: UserId,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<UserAchievement>>;
    abstract findByUserAndAchievement(
        userId: UserId,
        achievementId: AchievementId
    ): Promise<UserAchievement | null>;
    abstract findAll(
        filter: UserAchievementFilter,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<UserAchievement>>;
    
    abstract save(userAchievement: UserAchievement): Promise<void>;
    abstract delete(id: UserAchievementId): Promise<void>;
    
    abstract findUnlockedByUser(userId: UserId): Promise<UserAchievement[]>;
    abstract findInProgressByUser(userId: UserId): Promise<UserAchievement[]>;
    abstract findNearCompletionByUser(userId: UserId, threshold: number): Promise<UserAchievement[]>;
    
    abstract countUnlockedByUser(userId: UserId): Promise<number>;
    abstract countTotalUnlocked(): Promise<number>;
    abstract getRecentUnlocks(limit: number): Promise<UserAchievement[]>;
    
    abstract existsByUserAndAchievement(userId: UserId, achievementId: AchievementId): Promise<boolean>;
    abstract batchSave(userAchievements: UserAchievement[]): Promise<void>;
}
