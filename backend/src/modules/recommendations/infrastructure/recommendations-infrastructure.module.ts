import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Book,
  BookSchema,
} from '@/modules/books/infrastructure/schemas/public-api';
import {
  Genre,
  GenreSchema,
} from '@/modules/genres/infrastructure/schemas/public-api';
import {
  ReadingList,
  ReadingListSchema,
} from '@/modules/library/infrastructure/schemas/public-api';
import {
  Progress,
  ProgressSchema,
} from '@/modules/library/infrastructure/schemas/public-api';
import {
  Review,
  ReviewSchema,
} from '@/modules/reviews/infrastructure/schemas/public-api';
import {
  UserPreference,
  UserPreferenceSchema,
} from '@/modules/analytics/infrastructure/schemas/public-api';
import { AIRecommendationStrategy } from './strategies/ai-recommendation.strategy';
import { FallbackRecommendationStrategy } from './strategies/fallback-recommendation.strategy';
import { RecommendationFactory } from './recommendation.factory';
import { AIInfrastructureModule } from '@/modules/ai/infrastructure/public-api';
import { RecommendationDataRepository } from './recommendation-data.repository';
import { RecommendationCacheAdapter } from './recommendation-cache.adapter';
import { IRecommendationCachePort } from '@/modules/recommendations/domain/interfaces/recommendation-cache.port';
import { IRecommendationDataRepository } from '@/modules/recommendations/domain/interfaces/recommendation-data.repository.interface';
import { IRecommendationFactory } from '@/modules/recommendations/domain/interfaces/recommendation-factory.interface';

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
