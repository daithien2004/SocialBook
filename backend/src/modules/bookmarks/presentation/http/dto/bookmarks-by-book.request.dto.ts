import type { Actor } from '@/shared/casl/actor';
import { OffsetPaginationQueryDto } from '@/shared/platform/dto/offset-pagination-query.dto';
import { GetBookmarksByBookQuery } from '@/modules/bookmarks/application/queries/get-bookmarks-by-book/get-bookmarks-by-book.query';

export class BookmarksByBookRequestDto extends OffsetPaginationQueryDto {
  toQuery(actor: Actor, bookId: string): GetBookmarksByBookQuery {
    return new GetBookmarksByBookQuery(actor, bookId, {
      offset: this.effectiveOffset,
      limit: this.actualLimit,
    });
  }
}
