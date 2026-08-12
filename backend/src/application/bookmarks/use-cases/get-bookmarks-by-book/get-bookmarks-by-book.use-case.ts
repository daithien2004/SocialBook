import { Injectable } from '@nestjs/common';
import { IBookmarkRepository } from '@/domain/bookmarks/repositories/bookmark.repository.interface';
import { Bookmark } from '@/domain/bookmarks/entities/bookmark.entity';
import { GetBookmarksByBookQuery } from './get-bookmarks-by-book.query';

@Injectable()
export class GetBookmarksByBookUseCase {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute(query: GetBookmarksByBookQuery): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByBook(query.userId, query.bookId);
  }
}
