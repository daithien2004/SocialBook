import { Book } from '../entities/book.entity';

export abstract class IBookCacheService {
  abstract getDetail(bookId: string): Promise<Book | null>;
  abstract setDetail(book: Book): Promise<void>;
  abstract invalidateDetail(bookId: string, slug?: string): Promise<void>;
}
