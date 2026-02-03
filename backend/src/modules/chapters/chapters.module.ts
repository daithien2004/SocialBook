import { DataAccessModule } from '@/src/data-access/data-access.module';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { SearchModule } from '../search/search.module';
import { TextToSpeechModule } from '../text-to-speech/text-to-speech.module';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { FileImportService } from './file-import.service';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chapter.name, schema: ChapterSchema },
      { name: Book.name, schema: BookSchema },
    ]),
    DataAccessModule,
    SearchModule,
    forwardRef(() => TextToSpeechModule),
  ],
  controllers: [ChaptersController],
  providers: [ChaptersService, FileImportService],
  exports: [ChaptersService, DataAccessModule],
})
export class ChaptersModule { }
