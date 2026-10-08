import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CreateChapterHandler } from './commands/create-chapter/create-chapter.handler';
import { DeleteChapterHandler } from './commands/delete-chapter/delete-chapter.handler';
import { GetChapterByIdHandler } from './queries/get-chapter-by-id/get-chapter-by-id.handler';
import { GetChaptersHandler } from './queries/get-chapters/get-chapters.handler';
import { UpdateChapterHandler } from './commands/update-chapter/update-chapter.handler';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { GetChapterBySlugHandler } from './queries/get-chapter-by-slug/get-chapter-by-slug.handler';
import { ImportEpubPreviewHandler } from './commands/import-epub-preview/import-epub-preview.handler';
import { RecordChapterViewHandler } from './queries/record-chapter-view/record-chapter-view.handler';
import { GetChapterKnowledgeHandler } from './queries/get-chapter-knowledge/get-chapter-knowledge.handler';
import { AskChapterAIHandler } from './commands/ask-ai/ask-chapter-ai.handler';
import { AIApplicationModule } from '@/modules/ai/application/ai-application.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { FilesInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { StartChaptersImportHandler } from './commands/start-chapters-import/start-chapters-import.handler';
import { GetChaptersImportStatusHandler } from './queries/get-chapters-import-status/get-chapters-import-status.handler';
import { ChaptersImportModule } from '@/modules/chapters/infrastructure/queues/chapters-import/chapters-import.module';
import {
  SingleChapterProcessor,
  CREATE_SINGLE_CHAPTER_QUEUE,
} from './processors/single-chapter.processor';
import { isWorkerProcess } from '@/common/utils/process-role.util';

@Module({
  imports: [
    ChaptersRepositoryModule,
    IdGeneratorModule,
    AIApplicationModule,
    BooksRepositoryModule,
    FilesInfrastructureModule,
    ChaptersImportModule,
    BullModule.registerQueue({
      name: CREATE_SINGLE_CHAPTER_QUEUE,
    }),
    CqrsModule,
  ],

  providers: [
    CreateChapterHandler,
    DeleteChapterHandler,
    GetChapterByIdHandler,
    GetChapterBySlugHandler,
    GetChaptersHandler,
    UpdateChapterHandler,
    ImportEpubPreviewHandler,
    RecordChapterViewHandler,
    GetChapterKnowledgeHandler,
    AskChapterAIHandler,
    StartChaptersImportHandler,
    GetChaptersImportStatusHandler,
    ...(isWorkerProcess() ? [SingleChapterProcessor] : []),
  ],

  exports: [
    CreateChapterHandler,
    DeleteChapterHandler,
    GetChapterByIdHandler,
    GetChapterBySlugHandler,
    GetChaptersHandler,
    UpdateChapterHandler,
    ImportEpubPreviewHandler,
    RecordChapterViewHandler,
    GetChapterKnowledgeHandler,
    AskChapterAIHandler,
    StartChaptersImportHandler,
    GetChaptersImportStatusHandler,
  ],
})
export class ChaptersApplicationModule {}
