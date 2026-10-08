import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { TrackUserEventHandler } from './commands/track-user-event/track-user-event.handler';
import { GetTrendingBooksHandler } from './queries/get-trending-books/get-trending-books.handler';
import { AnalyticsFlushCron } from './analytics-flush.cron';
import { GetTopActiveReadersHandler } from './queries/get-top-active-readers/get-top-active-readers.handler';
import { AnalyticsInfrastructureModule } from '../infrastructure/analytics-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { GenresInfrastructureModule } from '@/modules/genres/infrastructure/genres-infrastructure.module';
import { ScoringService } from './services/scoring.service';
import { AnalyticsListener } from './listeners/analytics.listener';
import { BookAnalyticsListener } from './listeners/book-analytics.listener';
import { TtsAnalyticsListener } from './listeners/tts-analytics.listener';
import { TextToSpeechInfrastructureModule } from '@/modules/text-to-speech/infrastructure/text-to-speech-infrastructure.module';
import { TargetResolutionModule } from '@/modules/target-resolution/application/target-resolution/target-resolution.module';
import { isWorkerProcess } from '@/common/utils/process-role.util';

@Module({
  imports: [
    CqrsModule,
    AnalyticsInfrastructureModule,
    IdGeneratorModule,
    BooksRepositoryModule,
    GenresInfrastructureModule,
    TextToSpeechInfrastructureModule,
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
