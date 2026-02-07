import { Injectable, NotFoundException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';

@Injectable()
export class GetReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(id: string): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }
}
