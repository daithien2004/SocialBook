import { Injectable } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';

@Injectable()
export class GetBookReviewsUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(bookId: string): Promise<Review[]> {
    return this.reviewRepository.findByBookId(bookId);
  }
}
