import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CreateChapterHandler } from './use-cases/create-chapter/create-chapter.handler';
import { DeleteChapterHandler } from './use-cases/delete-chapter/delete-chapter.handler';
import { GetChapterByIdHandler } from './use-cases/get-chapter-by-id/get-chapter-by-id.handler';
import { GetChaptersHandler } from './use-cases/get-chapters/get-chapters.handler';
import { UpdateChapterHandler } from './use-cases/update-chapter/update-chapter.handler';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { GetChapterBySlugHandler } from './use-cases/get-chapter-by-slug/get-chapter-by-slug.handler';
import { ImportEpubPreviewHandler } from './use-cases/import-epub-preview/import-epub-preview.handler';
import { RecordChapterViewHandler } from './use-cases/record-chapter-view/record-chapter-view.handler';
import { GetChapterKnowledgeHandler } from './use-cases/get-chapter-knowledge/get-chapter-knowledge.handler';
import { AskChapterAIHandler } from './use-cases/ask-ai/ask-chapter-ai.handler';
import { AIApplicationModule } from '../ai/ai-application.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { FilesInfrastructureModule } from '@/infrastructure/files/files-infrastructure.module';
import { StartChaptersImportHandler } from './use-cases/start-chapters-import/start-chapters-import.handler';
import { GetChaptersImportStatusHandler } from './use-cases/get-chapters-import-status/get-chapters-import-status.handler';
import { ChaptersImportModule } from '@/infrastructure/queues/chapters-import/chapters-import.module';
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
