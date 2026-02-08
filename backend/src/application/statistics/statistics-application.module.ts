import { Module } from '@nestjs/common';
import { GetBookStatsUseCase } from './use-cases/get-book-stats.use-case';
import { GetEngagementStatsUseCase } from './use-cases/get-engagement-stats.use-case';
import { GetOverviewStatsUseCase } from './use-cases/get-overview-stats.use-case';
import { GetUserStatsUseCase } from './use-cases/get-user-stats.use-case';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { CommentsRepositoryModule } from '@/infrastructure/database/repositories/comments/comments-repository.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { ProgressRepositoryModule } from '@/infrastructure/database/repositories/progress/progress-repository.module';

@Module({
  imports: [
    UsersRepositoryModule,
    BooksRepositoryModule,
    PostsRepositoryModule,
    CommentsRepositoryModule,
    ReviewsRepositoryModule,
    ChaptersRepositoryModule,
    ProgressRepositoryModule,
  ],
  providers: [
    GetBookStatsUseCase,
    GetEngagementStatsUseCase,
    GetOverviewStatsUseCase,
    GetUserStatsUseCase,
  ],
  exports: [
    GetBookStatsUseCase,
    GetEngagementStatsUseCase,
    GetOverviewStatsUseCase,
    GetUserStatsUseCase,
  ],
})
export class StatisticsApplicationModule {}
