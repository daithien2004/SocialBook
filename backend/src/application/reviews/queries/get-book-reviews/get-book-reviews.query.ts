import { Query } from '@nestjs/cqrs';
import { Review } from '@/domain/reviews/entities/review.entity';

export class GetBookReviewsQuery extends Query<Review[]> {
  constructor(public readonly bookId: string) {
    super();
  }
}
