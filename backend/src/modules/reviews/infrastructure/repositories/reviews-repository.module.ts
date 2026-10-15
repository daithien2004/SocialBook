import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { ReviewRepository } from './review.repository';
import { ReviewReadRepository } from '@/modules/reviews/application/ports/review-read.repository';
import { PrismaReviewReadRepository } from './prisma-review-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IReviewRepository,
      useClass: ReviewRepository,
    },
    {
      provide: ReviewReadRepository,
      useClass: PrismaReviewReadRepository,
    },
  ],
  exports: [IReviewRepository, ReviewReadRepository],
})
export class ReviewsRepositoryModule {}
