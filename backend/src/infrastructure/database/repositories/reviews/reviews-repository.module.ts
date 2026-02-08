import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from '@/infrastructure/database/schemas/review.schema';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
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
  exports: [
    IReviewRepository,
    MongooseModule,
  ],
})
export class ReviewsRepositoryModule {}
