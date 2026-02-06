import { DataAccessModule } from '@/src/data-access/data-access.module';
import { Module } from '@nestjs/common';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    DataAccessModule,
    ContentModerationModule,
  ], controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule { }



