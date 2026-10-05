import { Author } from '@/domain/authors/entities/author.entity';
import { Query } from '@nestjs/cqrs';
export class GetAuthorByIdQuery extends Query<Author> {
  constructor(public readonly id: string) {
    super();
  }
}
