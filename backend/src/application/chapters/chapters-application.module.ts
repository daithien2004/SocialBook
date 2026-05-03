import { Module } from '@nestjs/common';
import { CreateChapterUseCase } from './use-cases/create-chapter/create-chapter.use-case';
import { DeleteChapterUseCase } from './use-cases/delete-chapter/delete-chapter.use-case';
import { GetChapterByIdUseCase } from './use-cases/get-chapter-by-id/get-chapter-by-id.use-case';
import { GetChaptersUseCase } from './use-cases/get-chapters/get-chapters.use-case';
import { UpdateChapterUseCase } from './use-cases/update-chapter/update-chapter.use-case';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { GetChapterBySlugUseCase } from './use-cases/get-chapter-by-slug/get-chapter-by-slug.use-case';
import { EpubParserService } from '@/infrastructure/files/epub-parser.service';
import { ImportEpubPreviewUseCase } from './use-cases/import-epub-preview/import-epub-preview.use-case';

import { GetChapterKnowledgeUseCase } from './use-cases/get-chapter-knowledge/get-chapter-knowledge.use-case';
import { AskChapterAIUseCase } from './use-cases/ask-ai/ask-chapter-ai.use-case';
import { GeminiApplicationModule } from '../gemini/gemini-application.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';


@Module({
  imports: [ChaptersRepositoryModule, IdGeneratorModule, GeminiApplicationModule, BooksRepositoryModule],

  providers: [
    CreateChapterUseCase,
    DeleteChapterUseCase,
    GetChapterByIdUseCase,
    GetChapterBySlugUseCase,
    GetChaptersUseCase,
    UpdateChapterUseCase,
    EpubParserService,
    ImportEpubPreviewUseCase,
    GetChapterKnowledgeUseCase,
    AskChapterAIUseCase,
  ],

  exports: [
    CreateChapterUseCase,
    DeleteChapterUseCase,
    GetChapterByIdUseCase,
    GetChapterBySlugUseCase,
    GetChaptersUseCase,
    UpdateChapterUseCase,
    EpubParserService,
    ImportEpubPreviewUseCase,
    GetChapterKnowledgeUseCase,
    AskChapterAIUseCase,
  ],

})

export class ChaptersApplicationModule {}
