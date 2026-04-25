import { Module } from '@nestjs/common';
import { GetPersonalizedRecommendationsUseCase } from './use-cases/get-personalized-recommendations.use-case';
import { RecommendationsInfrastructureModule } from '@/infrastructure/recommendations/recommendations-infrastructure.module';

@Module({
  imports: [RecommendationsInfrastructureModule],
  providers: [GetPersonalizedRecommendationsUseCase],
  exports: [GetPersonalizedRecommendationsUseCase],
})
export class RecommendationsApplicationModule {}
