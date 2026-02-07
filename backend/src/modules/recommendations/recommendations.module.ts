import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsController } from './presentation/recommendations.controller';
import { GetPersonalizedRecommendationsUseCase } from './application/use-cases/get-personalized-recommendations.use-case';
import { AIRecommendationStrategy } from './infrastructure/strategies/ai-recommendation.strategy';
import { FallbackRecommendationStrategy } from './infrastructure/strategies/fallback-recommendation.strategy';
import { GeminiModule } from '../gemini/gemini.module';

// Schemas
import { Book, BookSchema } from '../books/infrastructure/schemas/book.schema';
import { ReadingList, ReadingListSchema } from '../library/infrastructure/schemas/reading-list.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema'; // Check if this moved
import { Review, ReviewSchema } from '../reviews/infrastructure/schemas/review.schema';
import { Like, LikeSchema } from '../likes/infrastructure/schemas/like.schema';
import { Genre, GenreSchema } from '../genres/infrastructure/schemas/genre.schema';
import { UserOnboarding, UserOnboardingSchema } from '../onboarding/infrastructure/schemas/user-onboarding.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: ReadingList.name, schema: ReadingListSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: UserOnboarding.name, schema: UserOnboardingSchema },
    ]),
    GeminiModule,
  ],
  controllers: [RecommendationsController],
  providers: [
    GetPersonalizedRecommendationsUseCase,
    AIRecommendationStrategy,
    FallbackRecommendationStrategy,
  ],
  exports: [GetPersonalizedRecommendationsUseCase],
})
export class RecommendationsModule {}
