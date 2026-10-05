import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateReviewHandler } from './use-cases/create-review.handler';
import { DeleteReviewHandler } from './use-cases/delete-review.handler';
import { GetBookReviewsHandler } from './use-cases/get-book-reviews.handler';
import { GetReviewHandler } from './use-cases/get-review.handler';
import { ToggleReviewLikeHandler } from './use-cases/toggle-review-like.handler';
import { UpdateReviewHandler } from './use-cases/update-review.handler';
import { LibraryRepositoryModule } from '@/infrastructure/database/repositories/library/library-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';
import { ContentModerationApplicationModule } from '../content-moderation/content-moderation-application.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { RecommendationsInfrastructureModule } from '@/infrastructure/recommendations/recommendations-infrastructure.module';

@Module({
  imports: [
    CqrsModule,
    ReviewsRepositoryModule,
    ContentModerationApplicationModule,
    IdGeneratorModule,
    LibraryRepositoryModule,
    ChaptersRepositoryModule,
    RecommendationsInfrastructureModule,
  ],
  providers: [
    CreateReviewHandler,
    DeleteReviewHandler,
    GetBookReviewsHandler,
    GetReviewHandler,
    ToggleReviewLikeHandler,
    UpdateReviewHandler,
  ],
  exports: [
    CreateReviewHandler,
    DeleteReviewHandler,
    GetBookReviewsHandler,
    GetReviewHandler,
    ToggleReviewLikeHandler,
    UpdateReviewHandler,
  ],
})
export class ReviewsApplicationModule {}
