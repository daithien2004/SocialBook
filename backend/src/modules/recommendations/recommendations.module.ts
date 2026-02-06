import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChaptersModule } from '../chapters/chapters.module';
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
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema';
import {
  UserOnboarding,
  UserOnboardingSchema,
} from '../onboarding/schemas/user-onboarding.schema';

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
      { name: UserOnboarding.name, schema: UserOnboardingSchema },
    ]),
    ChaptersModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, GeminiService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
