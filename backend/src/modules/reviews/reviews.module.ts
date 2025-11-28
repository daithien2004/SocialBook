import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review, ReviewSchema } from './schemas/review.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    ContentModerationModule,
  ], controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule { }



