import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { AuthorReadModel } from '../read-models/author.read-model';

export abstract class AuthorIndexReadRepository {
  abstract findIndexPage(
    pagination: PageParams,
  ): Promise<PageResult<AuthorReadModel>>;
}
