import { Book } from '../entities/book.entity';

export const BOOK_CACHE_SERVICE_TOKEN = 'BOOK_CACHE_SERVICE_TOKEN';

export interface IBookCacheService {
  getDetail(bookId: string): Promise<Book | null>;
  setDetail(book: Book): Promise<void>;
  invalidateDetail(bookId: string, slug?: string): Promise<void>;
}
