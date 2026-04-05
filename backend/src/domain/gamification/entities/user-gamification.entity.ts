import { Entity } from '@/shared/domain/entity.base';
import { UserGamificationId } from '../value-objects/user-gamification-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { Streak } from '../value-objects/streak.vo';
import { XP } from '../value-objects/xp.vo';

export interface UserGamificationProps {
  userId: UserId;
  streak: Streak;
  lastReadDate: Date | null;
  streakFreezeCount: number;
  totalXP: XP;
}

export class UserGamification extends Entity<UserGamificationId> {
  private _props: UserGamificationProps;

  private constructor(
    id: UserGamificationId,
    props: UserGamificationProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: UserGamificationId;
    userId: string;
    currentStreak?: number;
    longestStreak?: number;
    streakFreezeCount?: number;
  }): UserGamification {
    return new UserGamification(props.id, {
      userId: UserId.create(props.userId),
      streak: Streak.create(props.currentStreak || 0, props.longestStreak || 0),
      lastReadDate: null,
      streakFreezeCount: props.streakFreezeCount || 2,
      totalXP: XP.zero(),
    });
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
      {
        userId: UserId.create(props.userId),
        streak: Streak.create(props.currentStreak, props.longestStreak),
        lastReadDate: props.lastReadDate,
        streakFreezeCount: props.streakFreezeCount,
        totalXP: XP.create(props.totalXP),
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): UserId {
    return this._props.userId;
  }
  get streak(): Streak {
    return this._props.streak;
  }
  get lastReadDate(): Date | null {
    return this._props.lastReadDate;
  }
  get streakFreezeCount(): number {
    return this._props.streakFreezeCount;
  }
  get totalXP(): XP {
    return this._props.totalXP;
  }

  recordReading(date: Date = new Date()): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const readDate = new Date(date);
    readDate.setHours(0, 0, 0, 0);

    if (this._props.lastReadDate) {
      const lastDate = new Date(this._props.lastReadDate);
      lastDate.setHours(0, 0, 0, 0);

      const diffTime = readDate.getTime() - lastDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        this._props.streak = this._props.streak.increment();
      } else if (diffDays > 1) {
        // Streak broken - check if we can use freeze
        if (this._props.streakFreezeCount > 0 && diffDays === 2) {
          this._props.streakFreezeCount--;
          this._props.streak = this._props.streak.freeze();
        } else {
          this._props.streak = Streak.startNew();
        }
      }
      // If diffDays === 0, same day - don't change streak
    } else {
      // First read
      this._props.streak = Streak.startNew();
    }

    this._props.lastReadDate = date;
    this.markAsUpdated();
  }

  addXP(xp: number): void {
    this._props.totalXP = this._props.totalXP.add(XP.create(xp));
    this.markAsUpdated();
  }

  useStreakFreeze(): boolean {
    if (this._props.streakFreezeCount > 0) {
      this._props.streakFreezeCount--;
      this.markAsUpdated();
      return true;
    }
    return false;
  }

  replenishStreakFreeze(count: number = 1): void {
    this._props.streakFreezeCount += count;
    this.markAsUpdated();
  }

  getLevel(): number {
    return this._props.totalXP.getLevel();
  }

  getProgressToNextLevel(): number {
    return this._props.totalXP.getProgressToNextLevel();
  }

  getXPForNextLevel(): number {
    return this._props.totalXP.getXPForNextLevel();
  }

  isStreakActive(): boolean {
    if (!this._props.lastReadDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = new Date(this._props.lastReadDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 1;
  }

  getConsecutiveDays(): number {
    return this._props.streak.getCurrent();
  }
}
