import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CreateChapterUseCase } from './use-cases/create-chapter/create-chapter.use-case';
import { DeleteChapterUseCase } from './use-cases/delete-chapter/delete-chapter.use-case';
import { GetChapterByIdUseCase } from './use-cases/get-chapter-by-id/get-chapter-by-id.use-case';
import { GetChaptersUseCase } from './use-cases/get-chapters/get-chapters.use-case';
import { UpdateChapterUseCase } from './use-cases/update-chapter/update-chapter.use-case';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { GetChapterBySlugUseCase } from './use-cases/get-chapter-by-slug/get-chapter-by-slug.use-case';
import { ImportEpubPreviewUseCase } from './use-cases/import-epub-preview/import-epub-preview.use-case';
import { RecordChapterViewUseCase } from './use-cases/record-chapter-view/record-chapter-view.use-case';
import { GetChapterKnowledgeUseCase } from './use-cases/get-chapter-knowledge/get-chapter-knowledge.use-case';
import { AskChapterAIUseCase } from './use-cases/ask-ai/ask-chapter-ai.use-case';
import { AIApplicationModule } from '../ai/ai-application.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { FilesInfrastructureModule } from '@/infrastructure/files/files-infrastructure.module';
import { StartChaptersImportUseCase } from './use-cases/start-chapters-import/start-chapters-import.use-case';
import { GetChaptersImportStatusUseCase } from './use-cases/get-chapters-import-status/get-chapters-import-status.use-case';
import { ChaptersImportModule } from '@/infrastructure/queues/chapters-import/chapters-import.module';
import {
  SingleChapterProcessor,
  CREATE_SINGLE_CHAPTER_QUEUE,
} from './processors/single-chapter.processor';

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
  ],

  providers: [
    CreateChapterUseCase,
    DeleteChapterUseCase,
    GetChapterByIdUseCase,
    GetChapterBySlugUseCase,
    GetChaptersUseCase,
    UpdateChapterUseCase,
    ImportEpubPreviewUseCase,
    RecordChapterViewUseCase,
    GetChapterKnowledgeUseCase,
    AskChapterAIUseCase,
    StartChaptersImportUseCase,
    GetChaptersImportStatusUseCase,
    SingleChapterProcessor,
  ],

  exports: [
    CreateChapterUseCase,
    DeleteChapterUseCase,
    GetChapterByIdUseCase,
    GetChapterBySlugUseCase,
    GetChaptersUseCase,
    UpdateChapterUseCase,
    ImportEpubPreviewUseCase,
    RecordChapterViewUseCase,
    GetChapterKnowledgeUseCase,
    AskChapterAIUseCase,
    StartChaptersImportUseCase,
    GetChaptersImportStatusUseCase,
  ],
})
export class ChaptersApplicationModule {}
