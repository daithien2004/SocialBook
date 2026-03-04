import { Entity } from '@/shared/domain/entity.base';
import { AchievementId } from '../value-objects/achievement-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { XP } from '../value-objects/xp.vo';

import { Identifier } from '@/shared/domain/identifier.base';

export class UserAchievementId extends Identifier {
    private constructor(id: string) {
        super(id);
    }

    static create(id: string): UserAchievementId {
        return new UserAchievementId(Identifier.validate(id, 'UserAchievement ID'));
    }
}

export class UserAchievement extends Entity<UserAchievementId> {
    private constructor(
        id: UserAchievementId,
        private _userId: UserId,
        private _achievementId: AchievementId,
        private _progress: number,
        private _isUnlocked: boolean,
        private _unlockedAt: Date | null,
        private _rewardXP: XP,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        id: UserAchievementId;
        userId: string;
        achievementId: string;
        rewardXP?: number;
    }): UserAchievement {
        return new UserAchievement(
            props.id,
            UserId.create(props.userId),
            AchievementId.create(props.achievementId),
            0,
            false,
            null,
            XP.create(props.rewardXP || 0)
        );
    }

    static reconstitute(props: {
        id: string;
        userId: string;
        achievementId: string;
        progress: number;
        isUnlocked: boolean;
        unlockedAt: Date | null;
        rewardXP: number;
        createdAt: Date;
        updatedAt: Date;
    }): UserAchievement {
        return new UserAchievement(
            UserAchievementId.create(props.id),
            UserId.create(props.userId),
            AchievementId.create(props.achievementId),
            props.progress,
            props.isUnlocked,
            props.unlockedAt,
            XP.create(props.rewardXP),
            props.createdAt,
            props.updatedAt
        );
    }

    get userId(): UserId {
        return this._userId;
    }

    get achievementId(): AchievementId {
        return this._achievementId;
    }

    get progress(): number {
        return this._progress;
    }

    get isUnlocked(): boolean {
        return this._isUnlocked;
    }

    get unlockedAt(): Date | null {
        return this._unlockedAt;
    }

    get rewardXP(): XP {
        return this._rewardXP;
    }

    updateProgress(progress: number): void {
        this._progress = Math.max(0, progress);
        this.markAsUpdated();
    }

    incrementProgress(amount: number = 1): void {
        this._progress += amount;
        this.markAsUpdated();
    }

    unlock(): void {
        if (!this._isUnlocked) {
            this._isUnlocked = true;
            this._unlockedAt = new Date();
            this.markAsUpdated();
        }
    }

    getProgressPercentage(targetValue: number): number {
        return Math.min(100, (this._progress / targetValue) * 100);
    }

    isNearCompletion(targetValue: number): boolean {
        return !this._isUnlocked && this._progress >= targetValue * 0.8;
    }
}
