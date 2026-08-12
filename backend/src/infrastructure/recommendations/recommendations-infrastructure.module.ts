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
import { RecommendationStrategyProvider } from './recommendation-strategy.provider';
import { GeminiRepositoryModule } from '../database/repositories/gemini/gemini-repository.module';
import { RecommendationDataAdapter } from './recommendation-data.adapter';
import { RecommendationCacheService } from './recommendation-cache.service';
import { IRecommendationCachePort } from '@/domain/recommendations/interfaces/recommendation-cache.port';
import { IRecommendationDataPort } from '@/domain/recommendations/interfaces/recommendation-data.port';
import { IRecommendationStrategyProvider } from '@/domain/recommendations/interfaces/recommendation-strategy-provider.interface';

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
    {
      provide: IRecommendationStrategyProvider,
      useClass: RecommendationStrategyProvider,
    },
    {
      provide: IRecommendationDataPort,
      useClass: RecommendationDataAdapter,
    },
    {
      provide: IRecommendationCachePort,
      useClass: RecommendationCacheService,
    },
  ],
  exports: [
    IRecommendationStrategyProvider,
    IRecommendationDataPort,
    IRecommendationCachePort,
  ],
})
export class RecommendationsInfrastructureModule {}
