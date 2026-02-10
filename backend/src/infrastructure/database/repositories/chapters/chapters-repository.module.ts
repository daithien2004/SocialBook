import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from '@/infrastructure/database/schemas/chapter.schema';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { ChapterRepository } from './chapter.repository';
import { Book, BookSchema } from '../../schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chapter.name, schema: ChapterSchema }]),
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }])
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
export class ChaptersRepositoryModule {}
