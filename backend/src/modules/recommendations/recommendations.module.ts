import { Module } from '@nestjs/common';
import { RecommendationsApplicationModule } from './application/recommendations-application.module';
import { RecommendationsController } from './presentation/recommendations.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineRecommendationAbilities } from './application/policies/recommendation.ability';

@Module({
  imports: [RecommendationsApplicationModule],
  controllers: [RecommendationsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineRecommendationAbilities]),
    },
    PoliciesGuard,
  ],
})
export class RecommendationsModule {}
