import { Module } from '@nestjs/common';
import { ReviewsRepositoryModule } from './repositories/reviews-repository.module';

@Module({
  imports: [ReviewsRepositoryModule],
  exports: [ReviewsRepositoryModule],
})
export class ReviewsInfrastructureModule {}
