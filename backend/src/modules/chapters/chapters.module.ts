import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { BooksModule } from '../books/books.module';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { SearchModule } from '../search/search.module';
import { TextToSpeechModule } from '../text-to-speech/text-to-speech.module';
import { FileImportService } from './file-import.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chapter.name, schema: ChapterSchema },
      { name: Book.name, schema: BookSchema },
    ]),
    BooksModule,
    SearchModule,
    forwardRef(() => TextToSpeechModule),
  ],
  controllers: [ChaptersController],
  providers: [ChaptersService, FileImportService],
  exports: [ChaptersService, FileImportService],
})
export class ChaptersModule { }
