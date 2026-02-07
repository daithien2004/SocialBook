import { Review } from '../entities/review.entity';

export abstract class IReviewRepository {
  abstract create(review: Review): Promise<Review>;
  abstract update(review: Review): Promise<Review>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Review | null>;
  abstract findByBookId(bookId: string): Promise<Review[]>;
  abstract findByUserId(userId: string): Promise<Review[]>;
  abstract toggleLike(reviewId: string, userId: string): Promise<Review | null>;
  abstract existsByUserAndBook(userId: string, bookId: string): Promise<boolean>;
  abstract getStatsForBooks(bookIds: string[]): Promise<Map<string, { rating: number; count: number }>>;
  
  // Statistics
  abstract countTotal(): Promise<number>;
}
