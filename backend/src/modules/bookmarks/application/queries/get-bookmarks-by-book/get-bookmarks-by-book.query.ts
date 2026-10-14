import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { BookmarkReadModel } from '@/modules/bookmarks/application/read-models/bookmark.read-model';

export class GetBookmarksByBookQuery extends Query<
  PageResult<BookmarkReadModel>
> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly pagination: PageParams,
  ) {
    super();
  }
}
