import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { ReviewRepository } from './review.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IReviewRepository,
      useClass: ReviewRepository,
    },
  ],
  exports: [IReviewRepository],
})
export class ReviewsRepositoryModule {}
