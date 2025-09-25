import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { ChapterService } from './chapters.service';
import { ChapterController } from './chapters.controller';
import { BooksModule } from '../books/books.module';
import { Book, BookSchema } from '../books/schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chapter.name, schema: ChapterSchema },
      { name: Book.name, schema: BookSchema },

    ]),
    BooksModule, // ✅ để inject được BookModel khi cần
  ],
  controllers: [ChapterController],
  providers: [ChapterService],
  exports: [ChapterService, MongooseModule],
})
export class ChaptersModule { }
