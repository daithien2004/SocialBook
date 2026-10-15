import type {
  PaginationOptions,
  PaginatedResult,
} from '@/shared/domain/pagination.types';
import type { BookListReadModel } from '../read-models/book-list.read-model';

export abstract class BookIndexReadRepository {
  abstract findIndexPage(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<BookListReadModel>>;
}
