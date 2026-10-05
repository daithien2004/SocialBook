import { Command } from '@nestjs/cqrs';
import { Review } from '@/domain/reviews/entities/review.entity';

export class ToggleReviewLikeCommand extends Command<Review> {
  constructor(
    public readonly reviewId: string,
    public readonly userId: string,
  ) {
    super();
  }
}
