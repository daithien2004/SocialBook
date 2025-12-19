import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { UserGamification, UserGamificationSchema } from './schemas/user-gamification.schema';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { UserAchievement, UserAchievementSchema } from './schemas/user-achievement.schema';
import { DailyGoal, DailyGoalSchema } from './schemas/daily-goal.schema';
import { UserOnboarding, UserOnboardingSchema } from '../onboarding/schemas/user-onboarding.schema';

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
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
