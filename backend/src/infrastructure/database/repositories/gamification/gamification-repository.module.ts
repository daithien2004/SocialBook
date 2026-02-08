import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Achievement, AchievementSchema } from '@/infrastructure/database/schemas/achievement.schema';
import { DailyGoal, DailyGoalSchema } from '@/infrastructure/database/schemas/daily-goal.schema';
import { UserAchievement, UserAchievementSchema } from '@/infrastructure/database/schemas/user-achievement.schema';
import { UserGamification, UserGamificationSchema } from '@/infrastructure/database/schemas/user-gamification.schema';
import { IUserGamificationRepository } from '@/domain/gamification/repositories/user-gamification.repository.interface';
import { UserGamificationRepository } from './user-gamification.repository';
import { IUserAchievementRepository } from '@/domain/gamification/repositories/user-achievement.repository.interface';
import { UserAchievementRepository } from './user-achievement.repository';
import { IAchievementRepository } from '@/domain/gamification/repositories/achievement.repository.interface';
import { AchievementRepository } from './achievement.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: DailyGoal.name, schema: DailyGoalSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: UserGamification.name, schema: UserGamificationSchema },
    ]),
  ],
  providers: [
    {
      provide: IUserGamificationRepository,
      useClass: UserGamificationRepository,
    },
    {
      provide: IUserAchievementRepository,
      useClass: UserAchievementRepository,
    },
    {
      provide: IAchievementRepository,
      useClass: AchievementRepository,
    },
  ],
  exports: [
    MongooseModule,
    IUserGamificationRepository,
    IUserAchievementRepository,
    IAchievementRepository,
  ],
})
export class GamificationRepositoryModule {}
