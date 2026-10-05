import { Query } from '@nestjs/cqrs';
import { Review } from '@/domain/reviews/entities/review.entity';

export class GetReviewQuery extends Query<Review> {
  constructor() {
    super();
  }
}
