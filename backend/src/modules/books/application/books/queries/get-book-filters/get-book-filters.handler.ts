import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BookReadRepository } from '@/modules/books/application/ports/book-read.repository';
import type { BookFiltersReadModel } from '@/modules/books/application/read-models/book-filters.read-model';
import { GetBookFiltersQuery } from './get-book-filters.query';

@QueryHandler(GetBookFiltersQuery)
export class GetBookFiltersHandler implements IQueryHandler<GetBookFiltersQuery> {
  constructor(private readonly bookReadRepository: BookReadRepository) {}

  execute(query: GetBookFiltersQuery): Promise<BookFiltersReadModel> {
    return this.bookReadRepository.getFilters(query.actor.ability);
  }
}
