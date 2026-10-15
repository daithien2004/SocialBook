import { Module } from '@nestjs/common';
import { ReviewsApplicationModule } from './application/reviews-application.module';
import { ReviewsController } from './presentation/reviews.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineReviewAbilities } from './application/policies/review.ability';

@Module({
  imports: [ReviewsApplicationModule],
  controllers: [ReviewsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineReviewAbilities]),
    },
    PoliciesGuard,
  ],
})
export class ReviewsModule {}
