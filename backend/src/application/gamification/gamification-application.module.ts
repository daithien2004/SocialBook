import { Module } from '@nestjs/common';
import { GetGamificationStatsUseCase } from './use-cases/get-gamification-stats/get-gamification-stats.use-case';
import { RecordReadingUseCase } from './use-cases/record-reading/record-reading.use-case';
import { UnlockAchievementUseCase } from './use-cases/unlock-achievement/unlock-achievement.use-case';
import { GamificationRepositoryModule } from '@/infrastructure/database/repositories/gamification/gamification-repository.module';

@Module({
  imports: [GamificationRepositoryModule],
  providers: [
    GetGamificationStatsUseCase,
    RecordReadingUseCase,
    UnlockAchievementUseCase,
  ],
  exports: [
    GetGamificationStatsUseCase,
    RecordReadingUseCase,
    UnlockAchievementUseCase,
  ],
})
export class GamificationApplicationModule {}
