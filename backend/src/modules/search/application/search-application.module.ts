import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { IntelligentSearchHandler } from './queries/intelligent-search/intelligent-search.handler';
import { SearchQueryExpansionService } from './services/search-query-expansion.service';
import { SearchRankingService } from './services/search-ranking.service';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { ReviewsInfrastructureModule } from '@/modules/reviews/infrastructure/public-api';
import { GenresInfrastructureModule } from '@/modules/genres/infrastructure/public-api';
import { AuthorsInfrastructureModule } from '@/modules/authors/infrastructure/public-api';
import { ChromaInfrastructureModule } from '@/modules/chroma/infrastructure/public-api';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { SearchCacheModule } from '@/modules/search/infrastructure/cache/search-cache.module';

@Module({
  imports: [
    CqrsModule,
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    ReviewsInfrastructureModule,
    GenresInfrastructureModule,
    AuthorsInfrastructureModule,
    ChromaInfrastructureModule,
    IdGeneratorModule,
    SearchCacheModule,
  ],
  providers: [
    IntelligentSearchHandler,
    SearchQueryExpansionService,
    SearchRankingService,
  ],
  exports: [IntelligentSearchHandler, SearchCacheModule],
})
export class SearchApplicationModule {}
