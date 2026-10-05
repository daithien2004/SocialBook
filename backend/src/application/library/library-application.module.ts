import { CqrsModule } from '@nestjs/cqrs';
﻿import { Module } from '@nestjs/common';
import { CreateCollectionHandler } from './commands/create-collection/create-collection.handler';
import { GetAllCollectionsHandler } from './queries/get-all-collections/get-all-collections.handler';
import { GetBookLibraryInfoHandler } from './queries/get-book-library-info/get-book-library-info.handler';
import { GetChapterProgressHandler } from './queries/get-chapter-progress/get-chapter-progress.handler';
import { GetCollectionByIdHandler } from './queries/get-collection-by-id/get-collection-by-id.handler';
import { GetLibraryHandler } from './queries/get-library/get-library.handler';
import { RecordReadingTimeHandler } from './commands/record-reading-time/record-reading-time.handler';
import { RemoveFromLibraryHandler } from './commands/remove-from-library/remove-from-library.handler';
import { UpdateCollectionsHandler } from './commands/update-collections/update-collections.handler';
import { UpdateProgressHandler } from './commands/update-progress/update-progress.handler';
import { UpdateStatusHandler } from './commands/update-status/update-status.handler';
import { LibraryRepositoryModule } from '@/infrastructure/database/repositories/library/library-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { AIInfrastructureModule } from '@/infrastructure/ai/ai-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

import { ProcessReadingSessionHandler } from './commands/process-reading-session/process-reading-session.handler';
import { UpdateCollectionHandler } from './commands/update-collection/update-collection.handler';
import { DeleteCollectionHandler } from './commands/delete-collection/delete-collection.handler';
import { GetKnowledgeGraphHandler } from './queries/get-knowledge-graph/get-knowledge-graph.handler';
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
