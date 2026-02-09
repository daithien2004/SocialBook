import { UserAchievement as UserAchievementEntity } from '@/domain/gamification/entities/user-achievement.entity';
import { UserAchievementDocument } from '@/infrastructure/database/schemas/user-achievement.schema';
import { Types } from 'mongoose';

interface UserAchievementPersistence {
  userId: Types.ObjectId;
  achievementId: Types.ObjectId;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rewardXP: number;
  updatedAt: Date;
}

export class UserAchievementMapper {
  static toDomain(document: UserAchievementDocument | any): UserAchievementEntity {
    return UserAchievementEntity.reconstitute({
      id: document._id.toString(),
      userId: document.userId?.toString() || '',
      achievementId: document.achievementId?.toString() || '',
      progress: document.progress || 0,
      isUnlocked: document.isUnlocked || false,
      unlockedAt: document.unlockedAt || null,
      rewardXP: document.rewardXP || 0,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    });
  }

  static toPersistence(userAchievement: UserAchievementEntity): UserAchievementPersistence {
    return {
      userId: new Types.ObjectId(userAchievement.userId.toString()),
      achievementId: new Types.ObjectId(userAchievement.achievementId.toString()),
      progress: userAchievement.progress,
      isUnlocked: userAchievement.isUnlocked,
      unlockedAt: userAchievement.unlockedAt || undefined,
      rewardXP: userAchievement.rewardXP.getValue(),
      updatedAt: userAchievement.updatedAt
    };
  }
}
