import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsController } from './presentation/reviews.controller';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { Review, ReviewSchema } from './infrastructure/schemas/review.schema';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { GetBookReviewsUseCase } from './application/use-cases/get-book-reviews.use-case';
import { UpdateReviewUseCase } from './application/use-cases/update-review.use-case';
import { DeleteReviewUseCase } from './application/use-cases/delete-review.use-case';
import { ToggleReviewLikeUseCase } from './application/use-cases/toggle-review-like.use-case';
import { ReviewRepository } from './infrastructure/repositories/review.repository';
import { IReviewRepository } from './domain/repositories/review.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    ContentModerationModule,
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewRepository,
    { provide: IReviewRepository, useClass: ReviewRepository },
    CreateReviewUseCase,
    GetBookReviewsUseCase,
    UpdateReviewUseCase,
    DeleteReviewUseCase,
    ToggleReviewLikeUseCase,
  ],
  exports: [
    IReviewRepository,
    ReviewRepository
  ],
})
export class ReviewsModule { }



