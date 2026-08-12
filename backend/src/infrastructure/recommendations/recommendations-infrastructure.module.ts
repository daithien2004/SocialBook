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
import { RecommendationFactory } from './recommendation.factory';
import { AIInfrastructureModule } from '../ai/ai-infrastructure.module';
import { RecommendationDataRepository } from './recommendation-data.repository';
import { RecommendationCacheAdapter } from './recommendation-cache.adapter';
import { IRecommendationCachePort } from '@/domain/recommendations/interfaces/recommendation-cache.port';
import { IRecommendationDataRepository } from '@/domain/recommendations/interfaces/recommendation-data.repository.interface';
import { IRecommendationFactory } from '@/domain/recommendations/interfaces/recommendation-factory.interface';

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
    AIInfrastructureModule,
  ],
  providers: [
    AIRecommendationStrategy,
    FallbackRecommendationStrategy,
    {
      provide: IRecommendationFactory,
      useClass: RecommendationFactory,
    },
    {
      provide: IRecommendationDataRepository,
      useClass: RecommendationDataRepository,
    },
    {
      provide: IRecommendationCachePort,
      useClass: RecommendationCacheAdapter,
    },
  ],
  exports: [
    IRecommendationFactory,
    IRecommendationDataRepository,
    IRecommendationCachePort,
  ],
})
export class RecommendationsInfrastructureModule {}
