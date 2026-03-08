import { Injectable } from '@nestjs/common';
import { NotFoundDomainException, ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';

@Injectable()
export class DeleteReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundDomainException('Review not found');

    if (review.userId.toString() !== userId) {
      throw new ForbiddenDomainException('You can only delete your own reviews');
    }

    await this.reviewRepository.delete(id);
  }
}

