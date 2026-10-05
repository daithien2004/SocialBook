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
import { ChromaRepositoryModule } from '../../infrastructure/database/repositories/chroma/chroma-repository.module';
import { BooksRepositoryModule } from '../../infrastructure/database/repositories/books/books-repository.module';
import { AuthorsRepositoryModule } from '../../infrastructure/database/repositories/authors/authors-repository.module';
import { ChaptersRepositoryModule } from '../../infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { AIInfrastructureModule } from '@/infrastructure/ai/ai-infrastructure.module';
import { BullModule } from '@nestjs/bullmq';
import { ChromaProcessor } from './processors/chroma.processor';
import { isWorkerProcess } from '@/common/utils/process-role.util';
import { ChromaReconciliationCron } from './chroma-reconciliation.cron';

@Module({
  imports: [
    CqrsModule,
    ChromaRepositoryModule,
    BooksRepositoryModule,
    AuthorsRepositoryModule,
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
