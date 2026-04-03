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

export interface UserAchievementProps {
  userId: UserId;
  achievementId: AchievementId;
  progress: number;
  isUnlocked: boolean;
  unlockedAt: Date | null;
  rewardXP: XP;
}

export class UserAchievement extends Entity<UserAchievementId> {
  private _props: UserAchievementProps;

  private constructor(
    id: UserAchievementId,
    props: UserAchievementProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: UserAchievementId;
    userId: string;
    achievementId: string;
    rewardXP?: number;
  }): UserAchievement {
    return new UserAchievement(props.id, {
      userId: UserId.create(props.userId),
      achievementId: AchievementId.create(props.achievementId),
      progress: 0,
      isUnlocked: false,
      unlockedAt: null,
      rewardXP: XP.create(props.rewardXP || 0),
    });
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
      {
        userId: UserId.create(props.userId),
        achievementId: AchievementId.create(props.achievementId),
        progress: props.progress,
        isUnlocked: props.isUnlocked,
        unlockedAt: props.unlockedAt,
        rewardXP: XP.create(props.rewardXP),
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): UserId {
    return this._props.userId;
  }
  get achievementId(): AchievementId {
    return this._props.achievementId;
  }
  get progress(): number {
    return this._props.progress;
  }
  get isUnlocked(): boolean {
    return this._props.isUnlocked;
  }
  get unlockedAt(): Date | null {
    return this._props.unlockedAt;
  }
  get rewardXP(): XP {
    return this._props.rewardXP;
  }

  updateProgress(progress: number): void {
    this._props.progress = Math.max(0, progress);
    this.markAsUpdated();
  }

  incrementProgress(amount: number = 1): void {
    this._props.progress += amount;
    this.markAsUpdated();
  }

  unlock(): void {
    if (!this._props.isUnlocked) {
      this._props.isUnlocked = true;
      this._props.unlockedAt = new Date();
      this.markAsUpdated();
    }
  }

  getProgressPercentage(targetValue: number): number {
    return Math.min(100, (this._props.progress / targetValue) * 100);
  }

  isNearCompletion(targetValue: number): boolean {
    return !this._props.isUnlocked && this._props.progress >= targetValue * 0.8;
  }
}
