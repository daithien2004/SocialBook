import { Onboarding, ReadingTime } from '@/domain/onboarding/entities/onboarding.entity';
import { UserOnboardingDocument, UserOnboarding } from '@/infrastructure/database/schemas/user-onboarding.schema';
import { Types } from 'mongoose';

interface OnboardingPersistence {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  isCompleted: boolean;
  currentStep: number;
  favoriteGenres: Types.ObjectId[];
  readingGoalType: string;
  readingGoalTarget: number;
  readingGoalUnit: string;
  readingTime: ReadingTime;
  completedAt?: Date;
}

export class OnboardingMapper {
  static toDomain(document: UserOnboardingDocument | null): Onboarding | null {
    if (!document) return null;
    
    return Onboarding.reconstitute({
      id: document._id.toString(),
      userId: document.userId.toString(),
      isCompleted: document.isCompleted,
      currentStep: document.currentStep,
      favoriteGenres: document.favoriteGenres ? document.favoriteGenres.map(id => id.toString()) : [],
      readingGoalType: document.readingGoalType,
      readingGoalTarget: document.readingGoalTarget,
      readingGoalUnit: document.readingGoalUnit,
      readingTime: document.readingTime,
      completedAt: document.completedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    });
  }

  static toPersistence(entity: Onboarding): OnboardingPersistence {
    return {
      _id: new Types.ObjectId(entity.id),
      userId: new Types.ObjectId(entity.userId),
      isCompleted: entity.isCompleted,
      currentStep: entity.currentStep,
      favoriteGenres: entity.favoriteGenres.map(id => new Types.ObjectId(id)),
      readingGoalType: entity.readingGoalType,
      readingGoalTarget: entity.readingGoalTarget,
      readingGoalUnit: entity.readingGoalUnit,
      readingTime: entity.readingTime,
      completedAt: entity.completedAt,
    };
  }
}

