import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
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
import { LibraryRepositoryModule } from '@/modules/library/infrastructure/repositories/library/library-repository.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/repositories/users/users-repository.module';
import { GenresInfrastructureModule } from '@/modules/genres/infrastructure/genres-infrastructure.module';
import { AIInfrastructureModule } from '@/modules/ai/infrastructure/public-api';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

import { ProcessReadingSessionHandler } from './commands/process-reading-session/process-reading-session.handler';
import { UpdateCollectionHandler } from './commands/update-collection/update-collection.handler';
import { DeleteCollectionHandler } from './commands/delete-collection/delete-collection.handler';
import { GetKnowledgeGraphHandler } from './queries/get-knowledge-graph/get-knowledge-graph.handler';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
import { RecommendationsInfrastructureModule } from '@/modules/recommendations/infrastructure/public-api';

@Module({
  imports: [
    LibraryRepositoryModule,
    BooksRepositoryModule,
    UsersRepositoryModule,
    GenresInfrastructureModule,
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
