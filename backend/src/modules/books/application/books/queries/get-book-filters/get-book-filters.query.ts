import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { BookFiltersReadModel } from '@/modules/books/application/read-models/book-filters.read-model';

export class GetBookFiltersQuery extends Query<BookFiltersReadModel> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
