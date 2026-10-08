import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { TrackUserEventHandler } from './commands/track-user-event/track-user-event.handler';
import { GetTrendingBooksHandler } from './queries/get-trending-books/get-trending-books.handler';
import { AnalyticsFlushCron } from './analytics-flush.cron';
import { GetTopActiveReadersHandler } from './queries/get-top-active-readers/get-top-active-readers.handler';
import { AnalyticsInfrastructureModule } from '../infrastructure/analytics-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { GenresInfrastructureModule } from '@/modules/genres/infrastructure/public-api';
import { ScoringService } from './services/scoring.service';
import { AnalyticsListener } from './listeners/analytics.listener';
import { BookAnalyticsListener } from './listeners/book-analytics.listener';
import { TtsAnalyticsListener } from './listeners/tts-analytics.listener';
import { TextToSpeechInfrastructureModule } from '@/modules/text-to-speech/infrastructure/public-api';
import { TargetResolutionModule } from '@/modules/target-resolution/application/public-api';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';

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
