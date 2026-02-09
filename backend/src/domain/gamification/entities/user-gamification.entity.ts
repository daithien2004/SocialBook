import { Entity } from '@/shared/domain/entity.base';
import { UserGamificationId } from '../value-objects/user-gamification-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { Streak } from '../value-objects/streak.vo';
import { XP } from '../value-objects/xp.vo';

export class UserGamification extends Entity<UserGamificationId> {
    private constructor(
        id: UserGamificationId,
        private _userId: UserId,
        private _streak: Streak,
        private _lastReadDate: Date | null,
        private _streakFreezeCount: number,
        private _totalXP: XP,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        userId: string;
        currentStreak?: number;
        longestStreak?: number;
        streakFreezeCount?: number;
    }): UserGamification {
        return new UserGamification(
            UserGamificationId.generate(),
            UserId.create(props.userId),
            Streak.create(props.currentStreak || 0, props.longestStreak || 0),
            null,
            props.streakFreezeCount || 2,
            XP.zero()
        );
    }

    static reconstitute(props: {
        id: string;
        userId: string;
        currentStreak: number;
        longestStreak: number;
        lastReadDate: Date | null;
        streakFreezeCount: number;
        totalXP: number;
        createdAt: Date;
        updatedAt: Date;
    }): UserGamification {
        return new UserGamification(
            UserGamificationId.create(props.id),
            UserId.create(props.userId),
            Streak.create(props.currentStreak, props.longestStreak),
            props.lastReadDate,
            props.streakFreezeCount,
            XP.create(props.totalXP),
            props.createdAt,
            props.updatedAt
        );
    }

    get userId(): UserId {
        return this._userId;
    }

    get streak(): Streak {
        return this._streak;
    }

    get lastReadDate(): Date | null {
        return this._lastReadDate;
    }

    get streakFreezeCount(): number {
        return this._streakFreezeCount;
    }

    get totalXP(): XP {
        return this._totalXP;
    }

    recordReading(date: Date = new Date()): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const readDate = new Date(date);
        readDate.setHours(0, 0, 0, 0);

        if (this._lastReadDate) {
            const lastDate = new Date(this._lastReadDate);
            lastDate.setHours(0, 0, 0, 0);

            const diffTime = readDate.getTime() - lastDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day - increment streak
                this._streak = this._streak.increment();
            } else if (diffDays > 1) {
                // Streak broken - check if we can use freeze
                if (this._streakFreezeCount > 0 && diffDays === 2) {
                    this._streakFreezeCount--;
                    this._streak = this._streak.freeze();
                } else {
                    this._streak = Streak.startNew();
                }
            }
            // If diffDays === 0, same day - don't change streak
        } else {
            // First read
            this._streak = Streak.startNew();
        }

        this._lastReadDate = date;
        this.markAsUpdated();
    }

    addXP(xp: number): void {
        this._totalXP = this._totalXP.add(XP.create(xp));
        this.markAsUpdated();
    }

    useStreakFreeze(): boolean {
        if (this._streakFreezeCount > 0) {
            this._streakFreezeCount--;
            this.markAsUpdated();
            return true;
        }
        return false;
    }

    replenishStreakFreeze(count: number = 1): void {
        this._streakFreezeCount += count;
        this.markAsUpdated();
    }

    getLevel(): number {
        return this._totalXP.getLevel();
    }

    getProgressToNextLevel(): number {
        return this._totalXP.getProgressToNextLevel();
    }

    getXPForNextLevel(): number {
        return this._totalXP.getXPForNextLevel();
    }

    isStreakActive(): boolean {
        if (!this._lastReadDate) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastDate = new Date(this._lastReadDate);
        lastDate.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 1;
    }

    getConsecutiveDays(): number {
        return this._streak.getCurrent();
    }
}
