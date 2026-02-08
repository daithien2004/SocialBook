import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Presentation layer imports
import { LibraryController } from './presentation/library.controller';
import { CollectionsController } from './presentation/collections.controller';

// Application layer imports - Use Cases
import { GetLibraryUseCase } from './application/use-cases/get-library/get-library.use-case';
import { UpdateStatusUseCase } from './application/use-cases/update-status/update-status.use-case';
import { UpdateProgressUseCase } from './application/use-cases/update-progress/update-progress.use-case';
import { RecordReadingTimeUseCase } from './application/use-cases/record-reading-time/record-reading-time.use-case';
import { UpdateCollectionsUseCase } from './application/use-cases/update-collections/update-collections.use-case';
import { RemoveFromLibraryUseCase } from './application/use-cases/remove-from-library/remove-from-library.use-case';
import { GetBookLibraryInfoUseCase } from './application/use-cases/get-book-library-info/get-book-library-info.use-case';
import { GetChapterProgressUseCase } from './application/use-cases/get-chapter-progress/get-chapter-progress.use-case';
import { RecordReadingUseCase } from '../gamification/application/use-cases/record-reading/record-reading.use-case';
import { CreateCollectionUseCase } from './application/use-cases/create-collection/create-collection.use-case';
import { GetAllCollectionsUseCase } from './application/use-cases/get-all-collections/get-all-collections.use-case';
import { GetCollectionByIdUseCase } from './application/use-cases/get-collection-by-id/get-collection-by-id.use-case';

// Infrastructure layer imports
import { LibraryInfrastructureModule } from './infrastructure/library.infrastructure.module';

// Schemas
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    LibraryInfrastructureModule,
    GamificationModule,
  ],
  controllers: [LibraryController, CollectionsController],
  providers: [
    // Use cases
    GetLibraryUseCase,
    UpdateStatusUseCase,
    UpdateProgressUseCase,
    RecordReadingTimeUseCase,
    UpdateCollectionsUseCase,
    RemoveFromLibraryUseCase,
    GetBookLibraryInfoUseCase,
    GetChapterProgressUseCase,
    RecordReadingUseCase,
    CreateCollectionUseCase,
    GetAllCollectionsUseCase,
    GetCollectionByIdUseCase,
  ],
  exports: [
    LibraryInfrastructureModule,
    GetLibraryUseCase,
    UpdateStatusUseCase,
    UpdateProgressUseCase,
    RecordReadingTimeUseCase,
    UpdateCollectionsUseCase,
    RemoveFromLibraryUseCase,
    GetBookLibraryInfoUseCase,
    GetChapterProgressUseCase,
    RecordReadingUseCase,
    CreateCollectionUseCase,
    GetAllCollectionsUseCase,
    GetCollectionByIdUseCase,
  ],
})
export class LibraryModule { }
