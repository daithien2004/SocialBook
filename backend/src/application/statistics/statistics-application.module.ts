import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GetBookStatsHandler } from './queries/get-book-stats/get-book-stats.handler';
import { GetEngagementStatsHandler } from './queries/get-engagement-stats/get-engagement-stats.handler';
import { GetGrowthStatsHandler } from './queries/get-growth-stats/get-growth-stats.handler';
import { GetOverviewStatsHandler } from './queries/get-overview-stats/get-overview-stats.handler';
import { GetUserStatsHandler } from './queries/get-user-stats/get-user-stats.handler';
import { CheckUserLocationsHandler } from './commands/check-user-locations/check-user-locations.handler';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { CommentsRepositoryModule } from '@/infrastructure/database/repositories/comments/comments-repository.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { ProgressRepositoryModule } from '@/infrastructure/database/repositories/progress/progress-repository.module';

@Module({
  imports: [
    CqrsModule,
    UsersRepositoryModule,
    BooksRepositoryModule,
    PostsRepositoryModule,
    CommentsRepositoryModule,
    ReviewsRepositoryModule,
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
