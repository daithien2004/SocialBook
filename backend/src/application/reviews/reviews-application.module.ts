import { Module } from '@nestjs/common';
import { CreateReviewUseCase } from './use-cases/create-review.use-case';
import { DeleteReviewUseCase } from './use-cases/delete-review.use-case';
import { GetBookReviewsUseCase } from './use-cases/get-book-reviews.use-case';
import { GetReviewUseCase } from './use-cases/get-review.use-case';
import { ToggleReviewLikeUseCase } from './use-cases/toggle-review-like.use-case';
import { UpdateReviewUseCase } from './use-cases/update-review.use-case';
import { LibraryRepositoryModule } from '@/infrastructure/database/repositories/library/library-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    ReviewsRepositoryModule,
    ContentModerationModule,
    IdGeneratorModule,
    LibraryRepositoryModule,
    ChaptersRepositoryModule,
  ],
  providers: [
    CreateReviewUseCase,
    DeleteReviewUseCase,
    GetBookReviewsUseCase,
    GetReviewUseCase,
    ToggleReviewLikeUseCase,
    UpdateReviewUseCase,
  ],
  exports: [
    CreateReviewUseCase,
    DeleteReviewUseCase,
    GetBookReviewsUseCase,
    GetReviewUseCase,
    ToggleReviewLikeUseCase,
    UpdateReviewUseCase,
  ],
})
export class ReviewsApplicationModule {}
