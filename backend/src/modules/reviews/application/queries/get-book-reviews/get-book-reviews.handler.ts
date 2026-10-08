import { GetBookReviewsQuery } from './get-book-reviews.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { Review } from '@/modules/reviews/domain/entities/review.entity';

@QueryHandler(GetBookReviewsQuery)
export class GetBookReviewsHandler {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(bookId: string): Promise<Review[]> {
    return this.reviewRepository.findByBookId(bookId);
  }
}
