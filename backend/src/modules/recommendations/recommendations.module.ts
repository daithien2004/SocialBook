// src/modules/recommendations/recommendations.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { GeminiService } from '../gemini/gemini.service';
import { Book, BookSchema } from '../books/schemas/book.schema';
import {
  ReadingList,
  ReadingListSchema,
} from '../library/schemas/reading-list.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { Like, LikeSchema } from '../likes/schemas/like.schema';
import { ChaptersService } from '../chapters/chapters.service';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: ReadingList.name, schema: ReadingListSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Genre.name, schema: GenreSchema },
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, GeminiService, ChaptersService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
