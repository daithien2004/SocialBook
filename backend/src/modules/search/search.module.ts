import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ChromaModule } from '../chroma/chroma.module';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Author, AuthorSchema } from '../authors/schemas/author.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Book.name, schema: BookSchema },
            { name: Author.name, schema: AuthorSchema },
        ]),
        ChromaModule,
    ],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService],
})
export class SearchModule { }
