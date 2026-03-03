import { Module } from '@nestjs/common';
import { GetCollectionStatsUseCase } from './use-cases/get-collection-stats/get-collection-stats.use-case';
import { ClearCollectionUseCase } from './use-cases/clear-collection/clear-collection.use-case';
import { BatchIndexUseCase } from './use-cases/batch-index/batch-index.use-case';
import { IndexDocumentUseCase } from './use-cases/index-document/index-document.use-case';
import { SearchUseCase } from './use-cases/search/search.use-case';
import { ReindexAllUseCase } from './use-cases/reindex-all/reindex-all.use-case';
import { ChromaRepositoryModule } from '../../infrastructure/database/repositories/chroma/chroma-repository.module';
import { BooksRepositoryModule } from '../../infrastructure/database/repositories/books/books-repository.module';
import { AuthorsRepositoryModule } from '../../infrastructure/database/repositories/authors/authors-repository.module';
import { ChaptersRepositoryModule } from '../../infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    ChromaRepositoryModule,
    BooksRepositoryModule,
    AuthorsRepositoryModule,
    ChaptersRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [
    GetCollectionStatsUseCase,
    ClearCollectionUseCase,
    BatchIndexUseCase,
    IndexDocumentUseCase,
    SearchUseCase,
    ReindexAllUseCase,
  ],
  exports: [
    GetCollectionStatsUseCase,
    ClearCollectionUseCase,
    BatchIndexUseCase,
    IndexDocumentUseCase,
    SearchUseCase,
    ReindexAllUseCase,
  ],
})
export class ChromaApplicationModule {}
