import { QueryHandler } from '@nestjs/cqrs';
import { IBookmarkRepository } from '../../../domain/repositories/bookmark.repository.interface';
import { Bookmark } from '../../../domain/entities/bookmark.entity';
import { GetBookmarksByBookQuery } from './get-bookmarks-by-book.query';

@QueryHandler(GetBookmarksByBookQuery)
export class GetBookmarksByBookHandler {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute(query: GetBookmarksByBookQuery): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByBook(query.userId, query.bookId);
  }
}
