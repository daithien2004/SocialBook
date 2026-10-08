import { Command } from '@nestjs/cqrs';
import { Review } from '@/modules/reviews/domain/entities/review.entity';

export class ToggleReviewLikeCommand extends Command<Review> {
  constructor(
    public readonly reviewId: string,
    public readonly userId: string,
  ) {
    super();
  }
}
