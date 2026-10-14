import { Query } from '@nestjs/cqrs';
import { BookListReadModel } from '@/modules/books/application/read-models/book-list.read-model';
import type { Actor } from '@/shared/casl/actor';

export class GetTopReadBooksQuery extends Query<BookListReadModel[]> {
  constructor(
    public readonly actor: Actor,
    public readonly timeRange: 'weekly' | 'monthly' | 'all',
    public readonly limit: number = 5,
  ) {
    super();
  }
}
