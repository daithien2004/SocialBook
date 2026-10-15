import type { BookFilter } from '../../domain/books/repositories/book.repository.interface';
import type { BookSearchReadModel } from '../read-models/book-search.read-model';
import type { BookListReadModel } from '../read-models/book-list.read-model';

export abstract class BookSearchReadRepository {
  abstract findByTitle(title: string): Promise<BookSearchReadModel | null>;

  abstract findIdsByFilter(filter: BookFilter): Promise<string[]>;

  abstract findSearchCandidates(
    filter: BookFilter,
    limit: number,
  ): Promise<BookSearchReadModel[]>;

  abstract findByIds(ids: string[]): Promise<BookListReadModel[]>;
}
