import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GetPersonalizedRecommendationsHandler } from './queries/get-personalized-recommendations/get-personalized-recommendations.handler';
import { RecommendationsInfrastructureModule } from '@/modules/recommendations/infrastructure/public-api';

@Module({
  imports: [CqrsModule, RecommendationsInfrastructureModule],
  providers: [GetPersonalizedRecommendationsHandler],
  exports: [GetPersonalizedRecommendationsHandler],
})
export class RecommendationsApplicationModule {}
