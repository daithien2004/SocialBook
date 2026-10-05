import { Module } from '@nestjs/common';
import { CreateGenreHandler } from './commands/create-genre/create-genre.handler';
import { DeleteGenreHandler } from './commands/delete-genre/delete-genre.handler';
import { GetGenreByIdHandler } from './queries/get-genre-by-id/get-genre-by-id.handler';
import { GetGenresHandler } from './queries/get-genres/get-genres.handler';
import { UpdateGenreHandler } from './commands/update-genre/update-genre.handler';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

export const CommandHandlers = [
  CreateGenreHandler,
  DeleteGenreHandler,
  UpdateGenreHandler,
];

export const QueryHandlers = [GetGenreByIdHandler, GetGenresHandler];

@Module({
  imports: [GenresRepositoryModule, BooksRepositoryModule, IdGeneratorModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [
    CreateGenreHandler,
    DeleteGenreHandler,
    GetGenreByIdHandler,
    GetGenresHandler,
    UpdateGenreHandler,
  ],
})
export class GenresApplicationModule {}
