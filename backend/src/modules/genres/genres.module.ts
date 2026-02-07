import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GenresController } from './presentation/genres.controller';
import { CreateGenreUseCase } from './application/use-cases/create-genre/create-genre.use-case';
import { UpdateGenreUseCase } from './application/use-cases/update-genre/update-genre.use-case';
import { GetGenresUseCase } from './application/use-cases/get-genres/get-genres.use-case';
import { DeleteGenreUseCase } from './application/use-cases/delete-genre/delete-genre.use-case';
import { GetGenreByIdUseCase } from './application/use-cases/get-genre-by-id/get-genre-by-id.use-case';
import { IGenreRepository } from './domain/repositories/genre.repository.interface';
import { GenresRepository } from './infrastructure/repositories/genres.repository';
import { Genre, GenreSchema } from './infrastructure/schemas/genre.schema';

import { BooksModule } from '../books/books.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Genre.name, schema: GenreSchema }]),
        forwardRef(() => BooksModule),
    ],
    controllers: [GenresController],
    providers: [
        {
            provide: IGenreRepository,
            useClass: GenresRepository,
        },
        CreateGenreUseCase,
        UpdateGenreUseCase,
        GetGenresUseCase,
        DeleteGenreUseCase,
        GetGenreByIdUseCase,
    ],
    exports: [
        IGenreRepository,
        CreateGenreUseCase,
        UpdateGenreUseCase,
        GetGenresUseCase,
        DeleteGenreUseCase,
        GetGenreByIdUseCase,
    ],
})
export class GenresModule { }