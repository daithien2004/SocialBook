import { Module } from '@nestjs/common';
import { CreateGenreHandler } from './use-cases/create-genre/create-genre.handler';
import { DeleteGenreHandler } from './use-cases/delete-genre/delete-genre.handler';
import { GetGenreByIdHandler } from './use-cases/get-genre-by-id/get-genre-by-id.handler';
import { GetGenresHandler } from './use-cases/get-genres/get-genres.handler';
import { UpdateGenreHandler } from './use-cases/update-genre/update-genre.handler';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

export const CommandHandlers = [
  CreateGenreHandler,
  DeleteGenreHandler,
  UpdateGenreHandler
];

export const QueryHandlers = [
  GetGenreByIdHandler,
  GetGenresHandler
];

@Module({
  imports: [GenresRepositoryModule, BooksRepositoryModule, IdGeneratorModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    CreateGenreHandler,
    DeleteGenreHandler,
    GetGenreByIdHandler,
    GetGenresHandler,
    UpdateGenreHandler,
  ],
})
export class GenresApplicationModule {}
