import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { Review } from '@/domain/reviews/entities/review.entity';

@Injectable()
export class GetReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(id: string): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundDomainException('Review not found');
    return review;
  }
}
