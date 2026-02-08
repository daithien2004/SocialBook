import { Module } from '@nestjs/common';
import { IntelligentSearchUseCase } from './use-cases/intelligent-search.use-case';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { AuthorsRepositoryModule } from '@/infrastructure/database/repositories/authors/authors-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { ChromaRepositoryModule } from '@/infrastructure/database/repositories/chroma/chroma-repository.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [
    BooksRepositoryModule,
    AuthorsRepositoryModule,
    ChaptersRepositoryModule,
    ReviewsRepositoryModule,
    GenresRepositoryModule,
    ChromaRepositoryModule,
    InfrastructureModule,
  ],
  providers: [IntelligentSearchUseCase],
  exports: [IntelligentSearchUseCase],
})
export class SearchApplicationModule {}
