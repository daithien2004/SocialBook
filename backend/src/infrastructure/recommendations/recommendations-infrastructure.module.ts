import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Book,
  BookSchema,
} from '@/infrastructure/database/schemas/book.schema';
import {
  Genre,
  GenreSchema,
} from '@/infrastructure/database/schemas/genre.schema';
import {
  ReadingList,
  ReadingListSchema,
} from '@/infrastructure/database/schemas/reading-list.schema';
import {
  Progress,
  ProgressSchema,
} from '@/infrastructure/database/schemas/progress.schema';
import {
  Review,
  ReviewSchema,
} from '@/infrastructure/database/schemas/review.schema';
import {
  UserPreference,
  UserPreferenceSchema,
} from '@/infrastructure/database/schemas/user-preference.schema';
import { AIRecommendationStrategy } from './strategies/ai-recommendation.strategy';
import { FallbackRecommendationStrategy } from './strategies/fallback-recommendation.strategy';
import { GeminiRepositoryModule } from '../database/repositories/gemini/gemini-repository.module';
import { RecommendationDataAdapter } from './recommendation-data.adapter';
import { IRecommendationDataPort } from '@/domain/recommendations/interfaces/recommendation-data.port';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: ReadingList.name, schema: ReadingListSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: UserPreference.name, schema: UserPreferenceSchema },
    ]),
    GeminiRepositoryModule,
  ],
  providers: [
    AIRecommendationStrategy,
    FallbackRecommendationStrategy,
    RecommendationDataAdapter,
    {
      provide: IRecommendationDataPort,
      useClass: RecommendationDataAdapter,
    },
  ],
  exports: [
    AIRecommendationStrategy,
    FallbackRecommendationStrategy,
    IRecommendationDataPort,
  ],
})
export class RecommendationsInfrastructureModule {}
