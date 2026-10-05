import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { IntelligentSearchHandler } from './queries/intelligent-search/intelligent-search.handler';
import { SearchQueryExpansionService } from './services/search-query-expansion.service';
import { SearchRankingService } from './services/search-ranking.service';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { AuthorsRepositoryModule } from '@/infrastructure/database/repositories/authors/authors-repository.module';
import { ChromaRepositoryModule } from '@/infrastructure/database/repositories/chroma/chroma-repository.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    CqrsModule,
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    ReviewsRepositoryModule,
    GenresRepositoryModule,
    AuthorsRepositoryModule,
    ChromaRepositoryModule,
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
