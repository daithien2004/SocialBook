import { Module } from '@nestjs/common';
import { ReviewsController } from './presentation/reviews.controller';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { GetBookReviewsUseCase } from './application/use-cases/get-book-reviews.use-case';
import { UpdateReviewUseCase } from './application/use-cases/update-review.use-case';
import { DeleteReviewUseCase } from './application/use-cases/delete-review.use-case';
import { ToggleReviewLikeUseCase } from './application/use-cases/toggle-review-like.use-case';
import { ReviewsInfrastructureModule } from './infrastructure/reviews.infrastructure.module';

@Module({
  imports: [
    ReviewsInfrastructureModule,
    ContentModerationModule,
  ],
  controllers: [ReviewsController],
  providers: [
    CreateReviewUseCase,
    GetBookReviewsUseCase,
    UpdateReviewUseCase,
    DeleteReviewUseCase,
    ToggleReviewLikeUseCase,
  ],
  exports: [
    ReviewsInfrastructureModule,
  ],
})
export class ReviewsModule { }



