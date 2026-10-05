import { GetBookReviewsQuery } from './get-book-reviews.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { Review } from '@/domain/reviews/entities/review.entity';

@QueryHandler(GetBookReviewsQuery)
export class GetBookReviewsHandler {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(bookId: string): Promise<Review[]> {
    return this.reviewRepository.findByBookId(bookId);
  }
}
