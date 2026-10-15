import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GetCollectionStatsHandler } from './queries/get-collection-stats/get-collection-stats.handler';
import { ClearCollectionHandler } from './commands/clear-collection/clear-collection.handler';
import { BatchIndexHandler } from './commands/batch-index/batch-index.handler';
import { IndexDocumentHandler } from './commands/index-document/index-document.handler';
import { SearchHandler } from './queries/search/search.handler';
import { ReindexAllHandler } from './commands/reindex-all/reindex-all.handler';
import { AskChatbotHandler } from './commands/ask-chatbot/ask-chatbot.handler';
import { ChromaInfrastructureModule } from '../infrastructure/chroma-infrastructure.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { AuthorsInfrastructureModule } from '@/modules/authors';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { AIInfrastructureModule } from '@/modules/ai/infrastructure/public-api';

@Module({
  imports: [
    CqrsModule,
    ChromaInfrastructureModule,
    BooksRepositoryModule,
    AuthorsInfrastructureModule,
    ChaptersRepositoryModule,
    IdGeneratorModule,
    AIInfrastructureModule,
  ],
  providers: [
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
