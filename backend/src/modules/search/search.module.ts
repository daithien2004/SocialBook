import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { Author, AuthorSchema } from '../authors/schemas/author.schema';
import { BooksModule } from '../books/books.module';
import { ChromaModule } from '../chroma/chroma.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Book.name, schema: BookSchema },
            { name: Chapter.name, schema: ChapterSchema },
            { name: Author.name, schema: AuthorSchema },
        ]),
        forwardRef(() => BooksModule),
        ChromaModule,
    ],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService],
})
export class SearchModule { }
