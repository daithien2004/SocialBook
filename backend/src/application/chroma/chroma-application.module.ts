import { Module } from '@nestjs/common';
import { GetCollectionStatsUseCase } from './use-cases/get-collection-stats/get-collection-stats.use-case';
import { ClearCollectionUseCase } from './use-cases/clear-collection/clear-collection.use-case';
import { BatchIndexUseCase } from './use-cases/batch-index/batch-index.use-case';
import { IndexDocumentUseCase } from './use-cases/index-document/index-document.use-case';
import { SearchUseCase } from './use-cases/search/search.use-case';
import { ChromaRepositoryModule } from '../../infrastructure/database/repositories/chroma/chroma-repository.module';

@Module({
  imports: [ChromaRepositoryModule],
  providers: [
    GetCollectionStatsUseCase,
    ClearCollectionUseCase,
    BatchIndexUseCase,
    IndexDocumentUseCase,
    SearchUseCase,
  ],
  exports: [
    GetCollectionStatsUseCase,
    ClearCollectionUseCase,
    BatchIndexUseCase,
    IndexDocumentUseCase,
    SearchUseCase,
  ],
})
export class ChromaApplicationModule {}
