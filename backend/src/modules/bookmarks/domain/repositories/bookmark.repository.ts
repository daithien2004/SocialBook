import { Bookmark } from '../entities/bookmark.entity';

export abstract class BookmarkRepository {
  abstract save(bookmark: Bookmark): Promise<void>;
  abstract findByParagraph(
    userId: string,
    paragraphId: string,
  ): Promise<Bookmark | null>;
  abstract deleteByParagraph(
    userId: string,
    paragraphId: string,
  ): Promise<void>;
}
