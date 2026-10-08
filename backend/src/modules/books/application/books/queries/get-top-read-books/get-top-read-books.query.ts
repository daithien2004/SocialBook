import { Query } from '@nestjs/cqrs';
import { BookListReadModel } from '@/modules/books/domain/books/read-models/book-list.read-model';

export class GetTopReadBooksQuery extends Query<BookListReadModel[]> {
  constructor(
    public readonly timeRange: 'weekly' | 'monthly' | 'all',
    public readonly limit: number = 5,
  ) {
    super();
  }
}
