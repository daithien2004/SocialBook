import { UserGamification as UserGamificationEntity } from '@/domain/gamification/entities/user-gamification.entity';
import { UserGamificationDocument } from '@/infrastructure/database/schemas/user-gamification.schema';
import { Types } from 'mongoose';

interface UserGamificationPersistence {
  userId: Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastReadDate?: Date;
  streakFreezeCount: number;
  totalXP: number;
  updatedAt: Date;
}

export class UserGamificationMapper {
  static toDomain(document: UserGamificationDocument | any): UserGamificationEntity {
    return UserGamificationEntity.reconstitute({
      id: document._id.toString(),
      userId: document.userId?.toString() || '',
      currentStreak: document.currentStreak || 0,
      longestStreak: document.longestStreak || 0,
      lastReadDate: document.lastReadDate || null,
      streakFreezeCount: document.streakFreezeCount || 2,
      totalXP: document.totalXP || 0,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    });
  }

  static toPersistence(gamification: UserGamificationEntity): UserGamificationPersistence {
    return {
      userId: new Types.ObjectId(gamification.userId.toString()),
      currentStreak: gamification.streak.getCurrent(),
      longestStreak: gamification.streak.getLongest(),
      lastReadDate: gamification.lastReadDate ?? undefined,
      streakFreezeCount: gamification.streakFreezeCount,
      totalXP: gamification.totalXP.getValue(),
      updatedAt: gamification.updatedAt
    };
  }
}
