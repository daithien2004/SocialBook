import { Query } from '@nestjs/cqrs';
import { Bookmark } from '@/domain/bookmarks/entities/bookmark.entity';

export class GetBookmarksByBookQuery extends Query<Bookmark[]> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) {
    super();
  }
}
