import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateReviewHandler } from './commands/create-review/create-review.handler';
import { DeleteReviewHandler } from './commands/delete-review/delete-review.handler';
import { GetBookReviewsHandler } from './queries/get-book-reviews/get-book-reviews.handler';
import { GetReviewHandler } from './queries/get-review/get-review.handler';
import { ToggleReviewLikeHandler } from './commands/toggle-review-like/toggle-review-like.handler';
import { UpdateReviewHandler } from './commands/update-review/update-review.handler';
import { LibraryRepositoryModule } from '@/modules/library/infrastructure/repositories/library/library-repository.module';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
import { ReviewsInfrastructureModule } from '../infrastructure/reviews-infrastructure.module';
import { ContentModerationApplicationModule } from '@/modules/content-moderation/application/public-api';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { RecommendationsInfrastructureModule } from '@/modules/recommendations/infrastructure/public-api';

@Module({
  imports: [
    CqrsModule,
    ReviewsInfrastructureModule,
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
