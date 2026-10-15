import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BookmarkReadRepository } from '@/modules/bookmarks/application/ports/bookmark-read.repository';
import { GetBookmarksByBookQuery } from './get-bookmarks-by-book.query';

@QueryHandler(GetBookmarksByBookQuery)
export class GetBookmarksByBookHandler implements IQueryHandler<GetBookmarksByBookQuery> {
  constructor(
    private readonly bookmarkReadRepository: BookmarkReadRepository,
  ) {}

  execute(query: GetBookmarksByBookQuery) {
    return this.bookmarkReadRepository.findByBook(
      query.actor.ability,
      query.bookId,
      query.pagination,
    );
  }
}
