import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ChromaModule } from '../chroma/chroma.module';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Author, AuthorSchema } from '../authors/schemas/author.schema';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Book.name, schema: BookSchema },
            { name: Author.name, schema: AuthorSchema },
            { name: Chapter.name, schema: ChapterSchema },
            { name: Review.name, schema: ReviewSchema },
            { name: Genre.name, schema: GenreSchema },
        ]),
        ChromaModule,
        GeminiModule,
    ],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService],
})
export class SearchModule { }
