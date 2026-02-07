import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserGamification, UserGamificationSchema } from './infrastructure/schemas/user-gamification.schema';
import { Achievement, AchievementSchema } from './infrastructure/schemas/achievement.schema';
import { UserAchievement, UserAchievementSchema } from './infrastructure/schemas/user-achievement.schema';
import { DailyGoal, DailyGoalSchema } from './infrastructure/schemas/daily-goal.schema';
import { UserOnboarding, UserOnboardingSchema } from '../onboarding/infrastructure/schemas/user-onboarding.schema';

// Domain layer imports
import { IUserGamificationRepository } from './domain/repositories/user-gamification.repository.interface';
import { IAchievementRepository } from './domain/repositories/achievement.repository.interface';
import { IUserAchievementRepository } from './domain/repositories/user-achievement.repository.interface';

// Infrastructure layer imports
import { UserGamificationRepository } from './infrastructure/repositories/user-gamification.repository';
import { AchievementRepository } from './infrastructure/repositories/achievement.repository';
import { UserAchievementRepository } from './infrastructure/repositories/user-achievement.repository';

// Application layer imports - Use Cases
import { RecordReadingUseCase } from './application/use-cases/record-reading/record-reading.use-case';
import { GetGamificationStatsUseCase } from './application/use-cases/get-gamification-stats/get-gamification-stats.use-case';
import { UnlockAchievementUseCase } from './application/use-cases/unlock-achievement/unlock-achievement.use-case';

// Presentation layer imports
import { GamificationController } from './presentation/gamification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserGamification.name, schema: UserGamificationSchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: DailyGoal.name, schema: DailyGoalSchema },
      { name: UserOnboarding.name, schema: UserOnboardingSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [
    // Repository implementations
    {
      provide: IUserGamificationRepository,
      useClass: UserGamificationRepository,
    },
    {
      provide: IAchievementRepository,
      useClass: AchievementRepository,
    },
    {
      provide: IUserAchievementRepository,
      useClass: UserAchievementRepository,
    },
    // Use cases
    RecordReadingUseCase,
    GetGamificationStatsUseCase,
    UnlockAchievementUseCase,
  ],
  exports: [
    IUserGamificationRepository,
    IAchievementRepository,
    IUserAchievementRepository,
    RecordReadingUseCase,
    GetGamificationStatsUseCase,
    UnlockAchievementUseCase,
  ],
})
export class GamificationModule {}
