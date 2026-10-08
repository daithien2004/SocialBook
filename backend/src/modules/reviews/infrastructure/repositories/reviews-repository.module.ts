import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Review,
  ReviewSchema,
} from '@/modules/reviews/infrastructure/schemas/review.schema';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { ReviewRepository } from './review.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
  ],
  providers: [
    {
      provide: IReviewRepository,
      useClass: ReviewRepository,
    },
  ],
  exports: [IReviewRepository],
})
export class ReviewsRepositoryModule {}
