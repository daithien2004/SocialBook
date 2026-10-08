import { Query } from '@nestjs/cqrs';
import { Review } from '@/modules/reviews/domain/entities/review.entity';

export class GetReviewQuery extends Query<Review> {
  constructor() {
    super();
  }
}
