import { Query } from '@nestjs/cqrs';
import { BookFilters } from '@/modules/books/domain/books/repositories/book.repository.interface';

export class GetFiltersQuery extends Query<BookFilters> {
  constructor() {
    super();
  }
}
