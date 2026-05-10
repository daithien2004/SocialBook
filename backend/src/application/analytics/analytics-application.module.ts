import { Module } from '@nestjs/common';
import { TrackUserEventUseCase } from './use-cases/track-user-event/track-user-event.use-case';
import { AnalyticsRepositoryModule } from '@/infrastructure/database/repositories/analytics/analytics-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { ScoringService } from './services/scoring.service';
import { AnalyticsListener } from './listeners/analytics.listener';

@Module({
  imports: [
    AnalyticsRepositoryModule, 
    IdGeneratorModule, 
    BooksRepositoryModule,
    GenresRepositoryModule,
    ChaptersRepositoryModule,
    PostsRepositoryModule,
  ],
  providers: [TrackUserEventUseCase, ScoringService, AnalyticsListener],
  exports: [TrackUserEventUseCase, ScoringService],
})
export class AnalyticsApplicationModule {}
