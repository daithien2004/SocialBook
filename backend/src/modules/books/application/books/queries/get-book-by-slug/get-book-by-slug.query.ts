import { Query } from '@nestjs/cqrs';
import { BookDetailReadModel } from '@/modules/books/application/read-models/book-detail.read-model';
import type { Actor } from '@/shared/casl/actor';

export class GetBookBySlugQuery extends Query<BookDetailReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly slug: string,
  ) {
    super();
  }
}
