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
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { AIInfrastructureModule } from '@/infrastructure/ai/ai-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';


import { ProcessReadingSessionUseCase } from './use-cases/process-reading-session/process-reading-session.use-case';
import { UpdateCollectionUseCase } from './use-cases/update-collection/update-collection.use-case';
import { DeleteCollectionUseCase } from './use-cases/delete-collection/delete-collection.use-case';
import { GetKnowledgeGraphUseCase } from './use-cases/get-knowledge-graph/get-knowledge-graph.use-case';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';


@Module({
  imports: [
    LibraryRepositoryModule,
    BooksRepositoryModule,
    UsersRepositoryModule,
    GenresRepositoryModule,
    AIInfrastructureModule,
    IdGeneratorModule,
    ChaptersRepositoryModule,
  ],


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
    ProcessReadingSessionUseCase,
    UpdateCollectionUseCase,
    DeleteCollectionUseCase,
    GetKnowledgeGraphUseCase,
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
    ProcessReadingSessionUseCase,
    UpdateCollectionUseCase,
    DeleteCollectionUseCase,
    GetKnowledgeGraphUseCase,
  ],
})
export class LibraryApplicationModule {}
