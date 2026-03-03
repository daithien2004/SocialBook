import { Module } from '@nestjs/common';
import { CreateGenreUseCase } from './use-cases/create-genre/create-genre.use-case';
import { DeleteGenreUseCase } from './use-cases/delete-genre/delete-genre.use-case';
import { GetGenreByIdUseCase } from './use-cases/get-genre-by-id/get-genre-by-id.use-case';
import { GetGenresUseCase } from './use-cases/get-genres/get-genres.use-case';
import { UpdateGenreUseCase } from './use-cases/update-genre/update-genre.use-case';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    GenresRepositoryModule,
    BooksRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [
    CreateGenreUseCase,
    DeleteGenreUseCase,
    GetGenreByIdUseCase,
    GetGenresUseCase,
    UpdateGenreUseCase,
  ],
  exports: [
    CreateGenreUseCase,
    DeleteGenreUseCase,
    GetGenreByIdUseCase,
    GetGenresUseCase,
    UpdateGenreUseCase,
  ],
})
export class GenresApplicationModule {}
