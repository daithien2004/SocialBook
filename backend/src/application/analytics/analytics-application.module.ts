import { Module } from '@nestjs/common';
import { TrackUserEventUseCase } from './use-cases/track-user-event/track-user-event.use-case';
import { GetTrendingBooksUseCase } from './use-cases/get-trending-books/get-trending-books.use-case';
import { GetTopActiveReadersUseCase } from './use-cases/get-top-active-readers/get-top-active-readers.use-case';
import { AnalyticsRepositoryModule } from '@/infrastructure/database/repositories/analytics/analytics-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { ScoringService } from './services/scoring.service';
import { AnalyticsListener } from './listeners/analytics.listener';
import { TargetResolutionModule } from '@/application/target-resolution/target-resolution.module';

@Module({
  imports: [
    AnalyticsRepositoryModule,
    IdGeneratorModule,
    BooksRepositoryModule,
    GenresRepositoryModule,
    TargetResolutionModule,
  ],
  providers: [
    TrackUserEventUseCase,
    GetTrendingBooksUseCase,
    GetTopActiveReadersUseCase,
    ScoringService,
    AnalyticsListener,
  ],
  exports: [
    TrackUserEventUseCase,
    GetTrendingBooksUseCase,
    GetTopActiveReadersUseCase,
    ScoringService,
  ],
})
export class AnalyticsApplicationModule {}
