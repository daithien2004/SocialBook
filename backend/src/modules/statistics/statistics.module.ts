import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StatisticsPersistenceModule } from './infrastructure/persistence/statistics-persistence.module';
import { CheckUserLocationsHandler } from './application/queries/check-user-locations/check-user-locations.handler';
import { GetActiveUsersHandler } from './application/queries/get-active-users/get-active-users.handler';
import { GetBookStatsHandler } from './application/queries/get-book-stats/get-book-stats.handler';
import { GetChapterEngagementHandler } from './application/queries/get-chapter-engagement/get-chapter-engagement.handler';
import { GetGeographicDistributionHandler } from './application/queries/get-geographic-distribution/get-geographic-distribution.handler';
import { GetGrowthStatsHandler } from './application/queries/get-growth-stats/get-growth-stats.handler';
import { GetOverviewStatsHandler } from './application/queries/get-overview-stats/get-overview-stats.handler';
import { GetReadingHeatmapHandler } from './application/queries/get-reading-heatmap/get-reading-heatmap.handler';
import { GetReadingSpeedHandler } from './application/queries/get-reading-speed/get-reading-speed.handler';
import { GetUserStatsHandler } from './application/queries/get-user-stats/get-user-stats.handler';
import { StatisticsController } from './presentation/statistics.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineStatisticsAbilities } from './application/policies/statistics.ability';

@Module({
  imports: [CqrsModule, StatisticsPersistenceModule],
  controllers: [StatisticsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineStatisticsAbilities]),
    },
    PoliciesGuard,
    CheckUserLocationsHandler,
    GetActiveUsersHandler,
    GetBookStatsHandler,
    GetChapterEngagementHandler,
    GetGeographicDistributionHandler,
    GetGrowthStatsHandler,
    GetOverviewStatsHandler,
    GetReadingHeatmapHandler,
    GetReadingSpeedHandler,
    GetUserStatsHandler,
  ],
})
export class StatisticsModule {}
