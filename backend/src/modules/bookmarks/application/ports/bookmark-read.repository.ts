import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { BookmarkReadModel } from '../read-models/bookmark.read-model';

export abstract class BookmarkReadRepository {
  abstract findByBook(
    ability: AppAbility,
    bookId: string,
    pagination: PageParams,
  ): Promise<PageResult<BookmarkReadModel>>;
}
