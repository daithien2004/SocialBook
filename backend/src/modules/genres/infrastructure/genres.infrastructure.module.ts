
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Genre, GenreSchema } from './schemas/genre.schema';
import { GenresRepository } from './repositories/genres.repository';
import { IGenreRepository } from '../domain/repositories/genre.repository.interface';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Genre.name, schema: GenreSchema }]),
    ],
    providers: [
        {
            provide: IGenreRepository,
            useClass: GenresRepository,
        },
    ],
    exports: [
        IGenreRepository,
    ],
})
export class GenresInfrastructureModule {}
