import { CqrsModule } from '@nestjs/cqrs';
﻿import { Module } from '@nestjs/common';
import { CreateCollectionHandler } from './use-cases/create-collection/create-collection.handler';
import { GetAllCollectionsHandler } from './use-cases/get-all-collections/get-all-collections.handler';
import { GetBookLibraryInfoHandler } from './use-cases/get-book-library-info/get-book-library-info.handler';
import { GetChapterProgressHandler } from './use-cases/get-chapter-progress/get-chapter-progress.handler';
import { GetCollectionByIdHandler } from './use-cases/get-collection-by-id/get-collection-by-id.handler';
import { GetLibraryHandler } from './use-cases/get-library/get-library.handler';
import { RecordReadingTimeHandler } from './use-cases/record-reading-time/record-reading-time.handler';
import { RemoveFromLibraryHandler } from './use-cases/remove-from-library/remove-from-library.handler';
import { UpdateCollectionsHandler } from './use-cases/update-collections/update-collections.handler';
import { UpdateProgressHandler } from './use-cases/update-progress/update-progress.handler';
import { UpdateStatusHandler } from './use-cases/update-status/update-status.handler';
import { LibraryRepositoryModule } from '@/infrastructure/database/repositories/library/library-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { AIInfrastructureModule } from '@/infrastructure/ai/ai-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

import { ProcessReadingSessionHandler } from './use-cases/process-reading-session/process-reading-session.handler';
import { UpdateCollectionHandler } from './use-cases/update-collection/update-collection.handler';
import { DeleteCollectionHandler } from './use-cases/delete-collection/delete-collection.handler';
import { GetKnowledgeGraphHandler } from './use-cases/get-knowledge-graph/get-knowledge-graph.handler';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { RecommendationsInfrastructureModule } from '@/infrastructure/recommendations/recommendations-infrastructure.module';

@Module({
  imports: [
    LibraryRepositoryModule,
    BooksRepositoryModule,
    UsersRepositoryModule,
    GenresRepositoryModule,
    AIInfrastructureModule,
    IdGeneratorModule,
    ChaptersRepositoryModule,
    RecommendationsInfrastructureModule,
    CqrsModule,
  ],

  providers: [
    CreateCollectionHandler,
    GetAllCollectionsHandler,
    GetBookLibraryInfoHandler,
    GetChapterProgressHandler,
    GetCollectionByIdHandler,
    GetLibraryHandler,
    RecordReadingTimeHandler,
    RemoveFromLibraryHandler,
    UpdateCollectionsHandler,
    UpdateProgressHandler,
    UpdateStatusHandler,
    ProcessReadingSessionHandler,
    UpdateCollectionHandler,
    DeleteCollectionHandler,
    GetKnowledgeGraphHandler,
  ],
  exports: [
    CreateCollectionHandler,
    GetAllCollectionsHandler,
    GetBookLibraryInfoHandler,
    GetChapterProgressHandler,
    GetCollectionByIdHandler,
    GetLibraryHandler,
    RecordReadingTimeHandler,
    RemoveFromLibraryHandler,
    UpdateCollectionsHandler,
    UpdateProgressHandler,
    UpdateStatusHandler,
    ProcessReadingSessionHandler,
    UpdateCollectionHandler,
    DeleteCollectionHandler,
    GetKnowledgeGraphHandler,
  ],
})
export class LibraryApplicationModule {}
