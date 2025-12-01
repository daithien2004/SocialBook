import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ChromaService } from './chroma.service';
import { ChromaController } from './chroma.controller';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { Author, AuthorSchema } from '../authors/schemas/author.schema';

@Global()
@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: Book.name, schema: BookSchema },
            { name: Chapter.name, schema: ChapterSchema },
            { name: Author.name, schema: AuthorSchema },
        ]),
    ],
    controllers: [ChromaController],
    providers: [ChromaService],
    exports: [ChromaService],
})
export class ChromaModule { }
