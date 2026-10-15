import { GetBookReviewsQuery } from './get-book-reviews.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ReviewReadRepository } from '@/modules/reviews/application/ports/review-read.repository';

@QueryHandler(GetBookReviewsQuery)
export class GetBookReviewsHandler implements IQueryHandler<GetBookReviewsQuery> {
  constructor(private readonly reviewReadRepository: ReviewReadRepository) {}

  execute(query: GetBookReviewsQuery) {
    return this.reviewReadRepository.findByBookId(
      query.bookId,
      query.actor.ability,
      query.actor.userId,
      query.page,
    );
  }
}
