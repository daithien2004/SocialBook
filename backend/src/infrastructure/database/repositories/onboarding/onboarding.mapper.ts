import { Onboarding } from '@/domain/onboarding/entities/onboarding.entity';
import { UserOnboardingDocument } from '@/infrastructure/database/schemas/user-onboarding.schema';
import { Types } from 'mongoose';

export class OnboardingMapper {
  static toDomain(document: UserOnboardingDocument | null): Onboarding | null {
    if (!document) return null;
    
    return new Onboarding(
      document._id.toString(),
      document.userId.toString(),
      document.isCompleted,
      document.currentStep,
      document.favoriteGenres ? document.favoriteGenres.map(id => id.toString()) : [],
      document.readingGoalType,
      document.readingGoalTarget,
      document.readingGoalUnit,
      document.readingTime,
      document.completedAt,
      (document as any).createdAt,
      (document as any).updatedAt
    );
  }

  static toPersistence(entity: Onboarding): any {
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

