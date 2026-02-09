import { AchievementId } from '../value-objects/achievement-id.vo';
import { AchievementCode } from '../value-objects/achievement-code.vo';
import { Entity } from '../../../shared/domain/entity.base';

export type AchievementCategory = 'reading' | 'streak' | 'social' | 'special' | 'onboarding';

export interface AchievementRequirement {
    type: 'books_completed' | 'pages_read' | 'streak_days' | 'reviews_written' | 'custom' | 'onboarding';
    value: number;
    condition?: string;
}

export class Achievement extends Entity<AchievementId> {
    private constructor(
        id: AchievementId,
        private _code: AchievementCode,
        private _name: string,
        private _description: string,
        private _category: AchievementCategory,
        private _requirement: AchievementRequirement,
        private _isActive: boolean,
        createdAt: Date,
        updatedAt: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        code: string;
        name: string;
        description: string;
        category: AchievementCategory;
        requirement: AchievementRequirement;
    }): Achievement {
        return new Achievement(
            AchievementId.generate(),
            AchievementCode.create(props.code),
            props.name.trim(),
            props.description.trim(),
            props.category,
            props.requirement,
            true,
            new Date(),
            new Date()
        );
    }

    static reconstitute(props: {
        id: string;
        code: string;
        name: string;
        description: string;
        category: AchievementCategory;
        requirement: AchievementRequirement;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Achievement {
        return new Achievement(
            AchievementId.create(props.id),
            AchievementCode.create(props.code),
            props.name,
            props.description,
            props.category,
            props.requirement,
            props.isActive,
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get code(): AchievementCode {
        return this._code;
    }

    get name(): string {
        return this._name;
    }

    get description(): string {
        return this._description;
    }

    get category(): AchievementCategory {
        return this._category;
    }

    get requirement(): AchievementRequirement {
        return this._requirement;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    // Business methods
    updateName(name: string): void {
        this._name = name.trim();
        this.markAsUpdated();
    }

    updateDescription(description: string): void {
        this._description = description.trim();
        this.markAsUpdated();
    }

    updateRequirement(requirement: AchievementRequirement): void {
        this._requirement = requirement;
        this.markAsUpdated();
    }

    activate(): void {
        this._isActive = true;
        this.markAsUpdated();
    }

    deactivate(): void {
        this._isActive = false;
        this.markAsUpdated();
    }

    checkUnlockCondition(progress: number): boolean {
        return progress >= this._requirement.value && this._isActive;
    }

    getProgressPercentage(currentValue: number): number {
        return Math.min(100, (currentValue / this._requirement.value) * 100);
    }
}

