import { ToggleReviewLikeCommand } from './toggle-review-like.command';
import { CommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { Review } from '@/modules/reviews/domain/entities/review.entity';

@CommandHandler(ToggleReviewLikeCommand)
export class ToggleReviewLikeHandler {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(reviewId: string, userId: string): Promise<Review> {
    const result = await this.reviewRepository.toggleLike(reviewId, userId);
    if (!result) throw new NotFoundDomainException('Review not found');
    return result;
  }
}
