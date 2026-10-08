import { GetReviewQuery } from './get-review.query';
import { QueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { Review } from '@/modules/reviews/domain/entities/review.entity';
import { ReviewErrorMessages } from '@/modules/reviews/application/error-messages';

@QueryHandler(GetReviewQuery)
export class GetReviewHandler {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(id: string): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review)
      throw new NotFoundDomainException(ReviewErrorMessages.REVIEW_NOT_FOUND);
    return review;
  }
}
