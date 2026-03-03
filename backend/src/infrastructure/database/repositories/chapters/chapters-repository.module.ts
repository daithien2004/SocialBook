import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from '@/infrastructure/database/schemas/chapter.schema';
import { Book, BookSchema } from '@/infrastructure/database/schemas/book.schema';
import { TextToSpeech, TextToSpeechSchema } from '@/infrastructure/database/schemas/text-to-speech.schema';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { ChapterRepository } from './chapter.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chapter.name, schema: ChapterSchema },
      { name: Book.name, schema: BookSchema },
      { name: TextToSpeech.name, schema: TextToSpeechSchema },
    ]),
  ],
  providers: [
    {
      provide: IChapterRepository,
      useClass: ChapterRepository,
    },
  ],
  exports: [
    IChapterRepository,
    MongooseModule,
  ],
})
export class ChaptersRepositoryModule { }
