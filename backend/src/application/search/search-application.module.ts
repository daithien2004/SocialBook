import { Module } from '@nestjs/common';
import { IntelligentSearchUseCase } from './use-cases/intelligent-search.use-case';
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
    IntelligentSearchUseCase,
    SearchQueryExpansionService,
    SearchRankingService,
  ],
  exports: [IntelligentSearchUseCase],
})
export class SearchApplicationModule { }
