import { Injectable } from '@nestjs/common';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { Review } from '@/domain/reviews/entities/review.entity';

@Injectable()
export class GetBookReviewsUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(bookId: string): Promise<Review[]> {
    return this.reviewRepository.findByBookId(bookId);
  }
}

