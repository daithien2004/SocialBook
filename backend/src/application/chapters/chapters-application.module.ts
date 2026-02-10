import { Module } from '@nestjs/common';
import { CreateChapterUseCase } from './use-cases/create-chapter/create-chapter.use-case';
import { DeleteChapterUseCase } from './use-cases/delete-chapter/delete-chapter.use-case';
import { GetChapterByIdUseCase } from './use-cases/get-chapter-by-id/get-chapter-by-id.use-case';
import { GetChaptersUseCase } from './use-cases/get-chapters/get-chapters.use-case';
import { UpdateChapterUseCase } from './use-cases/update-chapter/update-chapter.use-case';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { GetChapterBySlugUseCase } from './use-cases/get-chapter-by-slug/get-chapter-by-slug.use-case';

@Module({
  imports: [
    ChaptersRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [
    CreateChapterUseCase,
    DeleteChapterUseCase,
    GetChapterByIdUseCase,
    GetChapterBySlugUseCase,
    GetChaptersUseCase,
    UpdateChapterUseCase,
  ],
  exports: [
    CreateChapterUseCase,
    DeleteChapterUseCase,
    GetChapterByIdUseCase,
    GetChapterBySlugUseCase,
    GetChaptersUseCase,
    UpdateChapterUseCase,
  ],
})
export class ChaptersApplicationModule {}
