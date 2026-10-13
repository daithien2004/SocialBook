import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
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
  imports: [PostgresDatabaseModule, AIInfrastructureModule],
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
