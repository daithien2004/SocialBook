import { Bookmark } from '../entities/bookmark.entity';

export abstract class IBookmarkRepository {
  abstract save(bookmark: Bookmark): Promise<void>;
  abstract findById(id: string): Promise<Bookmark | null>;
  abstract findByParagraph(
    userId: string,
    paragraphId: string,
  ): Promise<Bookmark | null>;
  abstract findByBook(userId: string, bookId: string): Promise<Bookmark[]>;
  abstract deleteById(id: string): Promise<void>;
  abstract deleteByParagraph(
    userId: string,
    paragraphId: string,
  ): Promise<void>;
}
