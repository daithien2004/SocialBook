import { Injectable, NotFoundException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';

@Injectable()
export class ToggleReviewLikeUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(reviewId: string, userId: string): Promise<Review> {
    const result = await this.reviewRepository.toggleLike(reviewId, userId);
    if (!result) throw new NotFoundException('Review not found');
    return result;
  }
}
