import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GetCollectionStatsHandler } from './queries/get-collection-stats/get-collection-stats.handler';
import { ClearCollectionHandler } from './commands/clear-collection/clear-collection.handler';
import { BatchIndexHandler } from './commands/batch-index/batch-index.handler';
import { IndexDocumentHandler } from './commands/index-document/index-document.handler';
import { SearchHandler } from './commands/search/search.handler';
import { ReindexAllHandler } from './commands/reindex-all/reindex-all.handler';
import { AskChatbotHandler } from './commands/ask-chatbot/ask-chatbot.handler';
import { BookVectorIndexListener } from './listeners/book-vector-index.listener';
import { ChromaInfrastructureModule } from '../infrastructure/chroma-infrastructure.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { AuthorsInfrastructureModule } from '@/modules/authors/infrastructure/public-api';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { AIInfrastructureModule } from '@/modules/ai/infrastructure/public-api';
import { BullModule } from '@nestjs/bullmq';
import { ChromaProcessor } from './processors/chroma.processor';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { ChromaReconciliationCron } from './chroma-reconciliation.cron';

@Module({
  imports: [
    CqrsModule,
    ChromaInfrastructureModule,
    BooksRepositoryModule,
    AuthorsInfrastructureModule,
    ChaptersRepositoryModule,
    IdGeneratorModule,
    AIInfrastructureModule,
    BullModule.registerQueue({
      name: 'chroma',
    }),
  ],
  providers: [
    ...(isWorkerProcess() ? [ChromaProcessor, ChromaReconciliationCron] : []),
    GetCollectionStatsHandler,
    ClearCollectionHandler,
    BatchIndexHandler,
    IndexDocumentHandler,
    SearchHandler,
    ReindexAllHandler,
    AskChatbotHandler,
    BookVectorIndexListener,
  ],
  exports: [
    GetCollectionStatsHandler,
    ClearCollectionHandler,
    BatchIndexHandler,
    IndexDocumentHandler,
    SearchHandler,
    ReindexAllHandler,
    AskChatbotHandler,
  ],
})
export class ChromaApplicationModule {}
