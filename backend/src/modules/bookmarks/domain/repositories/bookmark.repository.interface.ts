import { Bookmark } from '../entities/bookmark.entity';

export abstract class IBookmarkRepository {
  abstract save(bookmark: Bookmark): Promise<void>;
  abstract findByParagraph(
    userId: string,
    paragraphId: string,
  ): Promise<Bookmark | null>;
  abstract findByBook(userId: string, bookId: string): Promise<Bookmark[]>;
  abstract deleteByParagraph(
    userId: string,
    paragraphId: string,
  ): Promise<void>;
}
