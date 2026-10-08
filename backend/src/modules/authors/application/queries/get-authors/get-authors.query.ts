import { Query } from '@nestjs/cqrs';
import { PaginatedResult } from '@/shared/domain/pagination.types';
import { Author } from '@/modules/authors/domain/entities/author.entity';

export class GetAuthorsQuery extends Query<PaginatedResult<Author>> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly name?: string,
    public readonly bio?: string,
  ) {
    super();
  }
}
