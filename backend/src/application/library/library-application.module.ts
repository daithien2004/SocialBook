import { Module } from '@nestjs/common';
import { CreateCollectionUseCase } from './use-cases/create-collection/create-collection.use-case';
import { GetAllCollectionsUseCase } from './use-cases/get-all-collections/get-all-collections.use-case';
import { GetBookLibraryInfoUseCase } from './use-cases/get-book-library-info/get-book-library-info.use-case';
import { GetChapterProgressUseCase } from './use-cases/get-chapter-progress/get-chapter-progress.use-case';
import { GetCollectionByIdUseCase } from './use-cases/get-collection-by-id/get-collection-by-id.use-case';
import { GetLibraryUseCase } from './use-cases/get-library/get-library.use-case';
import { RecordReadingTimeUseCase } from './use-cases/record-reading-time/record-reading-time.use-case';
import { RemoveFromLibraryUseCase } from './use-cases/remove-from-library/remove-from-library.use-case';
import { UpdateCollectionsUseCase } from './use-cases/update-collections/update-collections.use-case';
import { UpdateProgressUseCase } from './use-cases/update-progress/update-progress.use-case';
import { UpdateStatusUseCase } from './use-cases/update-status/update-status.use-case';
import { LibraryRepositoryModule } from '@/infrastructure/database/repositories/library/library-repository.module';

@Module({
  imports: [LibraryRepositoryModule],
  providers: [
    CreateCollectionUseCase,
    GetAllCollectionsUseCase,
    GetBookLibraryInfoUseCase,
    GetChapterProgressUseCase,
    GetCollectionByIdUseCase,
    GetLibraryUseCase,
    RecordReadingTimeUseCase,
    RemoveFromLibraryUseCase,
    UpdateCollectionsUseCase,
    UpdateProgressUseCase,
    UpdateStatusUseCase,
  ],
  exports: [
    CreateCollectionUseCase,
    GetAllCollectionsUseCase,
    GetBookLibraryInfoUseCase,
    GetChapterProgressUseCase,
    GetCollectionByIdUseCase,
    GetLibraryUseCase,
    RecordReadingTimeUseCase,
    RemoveFromLibraryUseCase,
    UpdateCollectionsUseCase,
    UpdateProgressUseCase,
    UpdateStatusUseCase,
  ],
})
export class LibraryApplicationModule {}
