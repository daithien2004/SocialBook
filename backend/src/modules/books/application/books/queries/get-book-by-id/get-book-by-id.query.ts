import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import { BookListReadModel } from '@/modules/books/application/read-models/book-list.read-model';

export class GetBookByIdQuery extends Query<BookListReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
  ) {
    super();
  }
}
