import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ReviewReadModel } from '../../read-models/review.read-model';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';

export class GetBookReviewsQuery extends Query<PageResult<ReviewReadModel>> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly page: PageParams,
  ) {
    super();
  }
}
