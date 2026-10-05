import { PaginatedResult } from '@/shared/domain/pagination.types';
import { Genre } from '@/domain/genres/entities/genre.entity';
import { Query } from '@nestjs/cqrs';
export class GetGenresQuery extends Query<PaginatedResult<Genre>> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly name?: string,
  ) {
    super();
  }
}
