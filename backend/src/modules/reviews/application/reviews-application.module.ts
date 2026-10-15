import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateReviewHandler } from './commands/create-review/create-review.handler';
import { DeleteReviewHandler } from './commands/delete-review/delete-review.handler';
import { GetBookReviewsHandler } from './queries/get-book-reviews/get-book-reviews.handler';
import { ToggleReviewLikeHandler } from './commands/toggle-review-like/toggle-review-like.handler';
import { UpdateReviewHandler } from './commands/update-review/update-review.handler';
import { LibraryRepositoryModule } from '@/modules/library/infrastructure/public-api';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { ReviewsInfrastructureModule } from '../infrastructure/reviews-infrastructure.module';
import { ContentModerationApplicationModule } from '@/modules/content-moderation/application/public-api';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
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
    ToggleReviewLikeHandler,
    UpdateReviewHandler,
  ],
})
export class ReviewsApplicationModule {}
