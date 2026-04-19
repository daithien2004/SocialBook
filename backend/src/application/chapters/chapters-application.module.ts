import { forwardRef, Module } from '@nestjs/common';
import { CreateChapterUseCase } from './use-cases/create-chapter/create-chapter.use-case';
import { DeleteChapterUseCase } from './use-cases/delete-chapter/delete-chapter.use-case';
import { GetChapterByIdUseCase } from './use-cases/get-chapter-by-id/get-chapter-by-id.use-case';
import { GetChaptersUseCase } from './use-cases/get-chapters/get-chapters.use-case';
import { UpdateChapterUseCase } from './use-cases/update-chapter/update-chapter.use-case';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { GetChapterBySlugUseCase } from './use-cases/get-chapter-by-slug/get-chapter-by-slug.use-case';
import { EpubParserService } from '@/infrastructure/external/epub-parser.service';
import { ImportEpubPreviewUseCase } from './use-cases/import-epub-preview/import-epub-preview.use-case';
import { StartChaptersImportUseCase } from './use-cases/start-chapters-import/start-chapters-import.use-case';
import { GetChaptersImportStatusUseCase } from './use-cases/get-chapters-import-status/get-chapters-import-status.use-case';
import { ChaptersImportModule } from '@/infrastructure/queues/chapters-import/chapters-import.module';

@Module({
  imports: [ChaptersRepositoryModule, IdGeneratorModule, forwardRef(() => ChaptersImportModule)],
  providers: [
    CreateChapterUseCase,
    DeleteChapterUseCase,
    GetChapterByIdUseCase,
    GetChapterBySlugUseCase,
    GetChaptersUseCase,
    UpdateChapterUseCase,
    EpubParserService,
    ImportEpubPreviewUseCase,
    StartChaptersImportUseCase,
    GetChaptersImportStatusUseCase,
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
    StartChaptersImportUseCase,
    GetChaptersImportStatusUseCase,
  ],
})
export class ChaptersApplicationModule {}
