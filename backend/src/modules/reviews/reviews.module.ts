import { Module } from '@nestjs/common';
import { ReviewsApplicationModule } from './application/reviews-application.module';
import { ReviewsController } from './presentation/reviews.controller';

@Module({
  imports: [ReviewsApplicationModule],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
