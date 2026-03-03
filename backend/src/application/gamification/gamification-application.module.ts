import { Module } from '@nestjs/common';
import { GetGamificationStatsUseCase } from './use-cases/get-gamification-stats/get-gamification-stats.use-case';
import { GetStreakUseCase } from './use-cases/get-streak/get-streak.use-case';
import { RecordReadingUseCase } from './use-cases/record-reading/record-reading.use-case';
import { UnlockAchievementUseCase } from './use-cases/unlock-achievement/unlock-achievement.use-case';
import { CheckInUseCase } from './use-cases/check-in/check-in.use-case';
import { GetDailyGoalsUseCase } from './use-cases/get-daily-goals/get-daily-goals.use-case';
import { GamificationRepositoryModule } from '@/infrastructure/database/repositories/gamification/gamification-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    GamificationRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [
    GetGamificationStatsUseCase,
    GetStreakUseCase,
    RecordReadingUseCase,
    UnlockAchievementUseCase,
    CheckInUseCase,
    GetDailyGoalsUseCase,
  ],
  exports: [
    GetGamificationStatsUseCase,
    GetStreakUseCase,
    RecordReadingUseCase,
    UnlockAchievementUseCase,
    CheckInUseCase,
    GetDailyGoalsUseCase,
  ],
})
export class GamificationApplicationModule {}
