import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { TrackUserEventHandler } from './commands/track-user-event/track-user-event.handler';
import { GetTrendingBooksHandler } from './queries/get-trending-books/get-trending-books.handler';
import { AnalyticsFlushCron } from './analytics-flush.cron';
import { GetTopActiveReadersHandler } from './queries/get-top-active-readers/get-top-active-readers.handler';
import { AnalyticsRepositoryModule } from '@/infrastructure/database/repositories/analytics/analytics-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { ScoringService } from './services/scoring.service';
import { AnalyticsListener } from './listeners/analytics.listener';
import { BookAnalyticsListener } from './listeners/book-analytics.listener';
import { TtsAnalyticsListener } from './listeners/tts-analytics.listener';
import { TextToSpeechRepositoryModule } from '@/infrastructure/database/repositories/text-to-speech/text-to-speech-repository.module';
import { TargetResolutionModule } from '@/application/target-resolution/target-resolution.module';
import { isWorkerProcess } from '@/common/utils/process-role.util';

@Module({
  imports: [
    CqrsModule,
    AnalyticsRepositoryModule,
    IdGeneratorModule,
    BooksRepositoryModule,
    GenresRepositoryModule,
    TextToSpeechRepositoryModule,
    TargetResolutionModule,
  ],
  providers: [
    ...(isWorkerProcess() ? [AnalyticsFlushCron] : []),
    TrackUserEventHandler,
    GetTrendingBooksHandler,
    GetTopActiveReadersHandler,
    ScoringService,
    AnalyticsListener,
    BookAnalyticsListener,
    TtsAnalyticsListener,
  ],
  exports: [
    TrackUserEventHandler,
    GetTrendingBooksHandler,
    GetTopActiveReadersHandler,
    ScoringService,
  ],
})
export class AnalyticsApplicationModule {}
