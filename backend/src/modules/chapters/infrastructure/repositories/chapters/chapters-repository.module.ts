import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Chapter,
  ChapterSchema,
} from '@/modules/chapters/infrastructure/schemas/chapter.schema';
import {
  Book,
  BookSchema,
} from '@/modules/books/infrastructure/schemas/public-api';
import {
  TextToSpeech,
  TextToSpeechSchema,
} from '@/modules/text-to-speech/infrastructure/schemas/public-api';
import {
  ChapterKnowledge,
  ChapterKnowledgeSchema,
} from '@/modules/chapters/infrastructure/schemas/chapter-knowledge.schema';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { IChapterKnowledgeRepository } from '@/modules/chapters/domain/chapters/repositories/chapter-knowledge.repository.interface';
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
  exports: [IChapterRepository, IChapterKnowledgeRepository],
})
export class ChaptersRepositoryModule {}
