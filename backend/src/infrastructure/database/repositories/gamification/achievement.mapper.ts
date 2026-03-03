import { Achievement as AchievementEntity } from '@/domain/gamification/entities/achievement.entity';
import { AchievementDocument } from '@/infrastructure/database/schemas/achievement.schema';
import { Types } from 'mongoose';

interface AchievementPersistence {
  code: string;
  name: string;
  description: string;
  category: string;
  requirement: {
    type: 'books_completed' | 'pages_read' | 'streak_days' | 'reviews_written' | 'custom' | 'onboarding';
    value: number;
    condition?: string;
  };
  isActive: boolean;
  updatedAt: Date;
}

export class AchievementMapper {
  static toDomain(document: AchievementDocument | any): AchievementEntity {
    return AchievementEntity.reconstitute({
      id: document._id.toString(),
      code: document.code,
      name: document.name,
      description: document.description,
      category: document.category,
      requirement: document.requirement,
      isActive: document.isActive,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    });
  }

  static toPersistence(achievement: AchievementEntity): AchievementPersistence {
    return {
      code: achievement.code.toString(),
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      requirement: achievement.requirement,
      isActive: achievement.isActive,
      updatedAt: achievement.updatedAt
    };
  }
}
