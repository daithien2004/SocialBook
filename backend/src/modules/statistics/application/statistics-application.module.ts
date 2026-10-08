import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GetBookStatsHandler } from './queries/get-book-stats/get-book-stats.handler';
import { GetEngagementStatsHandler } from './queries/get-engagement-stats/get-engagement-stats.handler';
import { GetGrowthStatsHandler } from './queries/get-growth-stats/get-growth-stats.handler';
import { GetOverviewStatsHandler } from './queries/get-overview-stats/get-overview-stats.handler';
import { GetUserStatsHandler } from './queries/get-user-stats/get-user-stats.handler';
import { CheckUserLocationsHandler } from './commands/check-user-locations/check-user-locations.handler';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/public-api';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/public-api';
import { CommentsInfrastructureModule } from '@/modules/comments/infrastructure/public-api';
import { ReviewsInfrastructureModule } from '@/modules/reviews/infrastructure/public-api';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { ProgressRepositoryModule } from '@/modules/statistics/infrastructure/repositories/progress/progress-repository.module';

@Module({
  imports: [
    CqrsModule,
    UsersRepositoryModule,
    BooksRepositoryModule,
    PostsRepositoryModule,
    CommentsInfrastructureModule,
    ReviewsInfrastructureModule,
    ChaptersRepositoryModule,
    ProgressRepositoryModule,
  ],
  providers: [
    GetBookStatsHandler,
    GetEngagementStatsHandler,
    GetGrowthStatsHandler,
    GetOverviewStatsHandler,
    GetUserStatsHandler,
    CheckUserLocationsHandler,
  ],
  exports: [
    GetBookStatsHandler,
    GetEngagementStatsHandler,
    GetGrowthStatsHandler,
    GetOverviewStatsHandler,
    GetUserStatsHandler,
    CheckUserLocationsHandler,
  ],
})
export class StatisticsApplicationModule {}
