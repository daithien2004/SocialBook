import type { Actor } from '@/shared/casl/actor';
import { GetBookReviewsQuery } from '../../application/queries/get-book-reviews/get-book-reviews.query';
import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';

export class GetBookReviewsDto extends PaginationQueryDto {
  toQuery(actor: Actor, bookId: string): GetBookReviewsQuery {
    return new GetBookReviewsQuery(actor, bookId, {
      offset: this.effectiveOffset,
      limit: this.actualLimit,
    });
  }
}
