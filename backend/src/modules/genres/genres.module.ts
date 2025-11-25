import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { Genre, GenreSchema } from './schemas/genre.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Genre.name, schema: GenreSchema },
            { name: Book.name, schema: BookSchema },
        ]),
    ],
    controllers: [GenresController],
    providers: [GenresService],
    exports: [GenresService],
})
export class GenresModule { }