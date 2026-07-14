import { Book } from '../entities/book.entity';

export const BOOK_CACHE_SERVICE = 'BOOK_CACHE_SERVICE';

export interface IBookCacheService {
  getDetail(bookId: string): Promise<Book | null>;
  setDetail(book: Book): Promise<void>;
  invalidateDetail(bookId: string, slug?: string): Promise<void>;
}
