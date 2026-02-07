import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';
import { Achievement, AchievementCategory } from '../entities/achievement.entity';
import { AchievementId } from '../value-objects/achievement-id.vo';
import { AchievementCode } from '../value-objects/achievement-code.vo';

export interface AchievementFilter {
    category?: AchievementCategory;
    isActive?: boolean;
    search?: string;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export abstract class IAchievementRepository {
    abstract findById(id: AchievementId): Promise<Achievement | null>;
    abstract findByCode(code: AchievementCode): Promise<Achievement | null>;
    abstract findAll(
        filter: AchievementFilter,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<Achievement>>;
    
    abstract save(achievement: Achievement): Promise<void>;
    abstract delete(id: AchievementId): Promise<void>;
    
    abstract findByCategory(category: AchievementCategory): Promise<Achievement[]>;
    abstract findActive(): Promise<Achievement[]>;
    abstract findByRequirementType(type: string): Promise<Achievement[]>;
    
    abstract existsByCode(code: AchievementCode): Promise<boolean>;
    abstract countByCategory(): Promise<Record<AchievementCategory, number>>;
    abstract countActive(): Promise<number>;
}
