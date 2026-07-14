import { Injectable } from '@nestjs/common';
import { IBookmarkRepository } from '@/domain/bookmarks/repositories/bookmark.repository.interface';
import { Bookmark } from '@/domain/bookmarks/entities/bookmark.entity';

export class GetBookmarksByBookQuery {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) {}
}

@Injectable()
export class GetBookmarksByBookUseCase {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute(query: GetBookmarksByBookQuery): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByBook(query.userId, query.bookId);
  }
}
