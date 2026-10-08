import { Query } from '@nestjs/cqrs';
import { BookDetailReadModel } from '@/modules/books/domain/books/read-models/book-detail.read-model';

export class GetBookBySlugQuery extends Query<BookDetailReadModel> {
  constructor(public readonly slug: string) {
    super();
  }
}
