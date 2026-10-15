import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { ReviewReadModel } from '../read-models/review.read-model';

export abstract class ReviewReadRepository {
  abstract findByBookId(
    bookId: string,
    ability: AppAbility,
    viewerId: string,
    page: PageParams,
  ): Promise<PageResult<ReviewReadModel>>;
}
