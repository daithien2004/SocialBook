import { Module, forwardRef } from '@nestjs/common';
import { GenresController } from './presentation/genres.controller';
import { CreateGenreUseCase } from './application/use-cases/create-genre/create-genre.use-case';
import { UpdateGenreUseCase } from './application/use-cases/update-genre/update-genre.use-case';
import { GetGenresUseCase } from './application/use-cases/get-genres/get-genres.use-case';
import { DeleteGenreUseCase } from './application/use-cases/delete-genre/delete-genre.use-case';
import { GetGenreByIdUseCase } from './application/use-cases/get-genre-by-id/get-genre-by-id.use-case';

import { GenresInfrastructureModule } from './infrastructure/genres.infrastructure.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

import { BooksModule } from '../books/books.module';

@Module({
    imports: [
        GenresInfrastructureModule,
        CloudinaryModule,
        forwardRef(() => BooksModule),
    ],
    controllers: [GenresController],
    providers: [
        CreateGenreUseCase,
        UpdateGenreUseCase,
        GetGenresUseCase,
        DeleteGenreUseCase,
        GetGenreByIdUseCase,
    ],
    exports: [
        GenresInfrastructureModule,
        CreateGenreUseCase,
        UpdateGenreUseCase,
        GetGenresUseCase,
        DeleteGenreUseCase,
        GetGenreByIdUseCase,
    ],
})
export class GenresModule { }