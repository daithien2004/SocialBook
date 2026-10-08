import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { IntelligentSearchHandler } from './queries/intelligent-search/intelligent-search.handler';
import { SearchQueryExpansionService } from './services/search-query-expansion.service';
import { SearchRankingService } from './services/search-ranking.service';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
import { ReviewsInfrastructureModule } from '@/modules/reviews/infrastructure/reviews-infrastructure.module';
import { GenresInfrastructureModule } from '@/modules/genres/infrastructure/genres-infrastructure.module';
import { AuthorsInfrastructureModule } from '@/modules/authors/infrastructure/authors-infrastructure.module';
import { ChromaInfrastructureModule } from '@/modules/chroma/infrastructure/chroma-infrastructure.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    CqrsModule,
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    ReviewsInfrastructureModule,
    GenresInfrastructureModule,
    AuthorsInfrastructureModule,
    ChromaInfrastructureModule,
    InfrastructureModule,
    IdGeneratorModule,
  ],
  providers: [
    IntelligentSearchHandler,
    SearchQueryExpansionService,
    SearchRankingService,
  ],
  exports: [IntelligentSearchHandler],
})
export class SearchApplicationModule {}
