import { Query } from '@nestjs/cqrs';
import { Book } from '@/modules/books/domain/books/entities/book.entity';

export class GetBookByIdQuery extends Query<Book> {
  constructor(public readonly id: string) {
    super();
  }
}
