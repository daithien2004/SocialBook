import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Chapter,
  ChapterSchema,
} from '@/infrastructure/database/schemas/chapter.schema';
import {
  Book,
  BookSchema,
} from '@/infrastructure/database/schemas/book.schema';
import {
  TextToSpeech,
  TextToSpeechSchema,
} from '@/infrastructure/database/schemas/text-to-speech.schema';
import {
  ChapterKnowledge,
  ChapterKnowledgeSchema,
} from '@/infrastructure/database/schemas/chapter-knowledge.schema';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IChapterKnowledgeRepository } from '@/domain/chapters/repositories/chapter-knowledge.repository.interface';
import { ChapterRepository } from './chapter.repository';
import { ChapterKnowledgeRepository } from './chapter-knowledge.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chapter.name, schema: ChapterSchema },
      { name: Book.name, schema: BookSchema },
      { name: TextToSpeech.name, schema: TextToSpeechSchema },
      { name: ChapterKnowledge.name, schema: ChapterKnowledgeSchema },
    ]),
  ],
  providers: [
    {
      provide: IChapterRepository,
      useClass: ChapterRepository,
    },
    {
      provide: IChapterKnowledgeRepository,
      useClass: ChapterKnowledgeRepository,
    },
  ],
  exports: [IChapterRepository, IChapterKnowledgeRepository, MongooseModule],
})

export class ChaptersRepositoryModule {}
