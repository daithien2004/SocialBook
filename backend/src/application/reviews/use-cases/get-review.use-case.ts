import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { Review } from '@/domain/reviews/entities/review.entity';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class GetReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(id: string): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundDomainException(ErrorMessages.REVIEW_NOT_FOUND);
    return review;
  }
}
