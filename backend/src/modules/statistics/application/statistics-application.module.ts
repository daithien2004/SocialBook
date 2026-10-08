import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GetBookStatsHandler } from './queries/get-book-stats/get-book-stats.handler';
import { GetEngagementStatsHandler } from './queries/get-engagement-stats/get-engagement-stats.handler';
import { GetGrowthStatsHandler } from './queries/get-growth-stats/get-growth-stats.handler';
import { GetOverviewStatsHandler } from './queries/get-overview-stats/get-overview-stats.handler';
import { GetUserStatsHandler } from './queries/get-user-stats/get-user-stats.handler';
import { CheckUserLocationsHandler } from './commands/check-user-locations/check-user-locations.handler';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/repositories/users/users-repository.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/repositories/posts/posts-repository.module';
import { CommentsInfrastructureModule } from '@/modules/comments/infrastructure/comments-infrastructure.module';
import { ReviewsInfrastructureModule } from '@/modules/reviews/infrastructure/reviews-infrastructure.module';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
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
