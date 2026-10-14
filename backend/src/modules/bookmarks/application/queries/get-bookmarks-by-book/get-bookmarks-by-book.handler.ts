import { ForbiddenError } from '@casl/ability';
import { QueryHandler } from '@nestjs/cqrs';
import { BookmarkReadRepository } from '@/modules/bookmarks/application/ports/bookmark-read.repository';
import { GetBookmarksByBookQuery } from './get-bookmarks-by-book.query';

@QueryHandler(GetBookmarksByBookQuery)
export class GetBookmarksByBookHandler {
  constructor(
    private readonly bookmarkReadRepository: BookmarkReadRepository,
  ) {}

  execute(query: GetBookmarksByBookQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan('read', 'Bookmark');
    return this.bookmarkReadRepository.findByBook(
      query.actor.ability,
      query.bookId,
      query.pagination,
    );
  }
}
