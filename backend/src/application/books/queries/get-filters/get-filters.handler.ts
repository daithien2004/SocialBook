import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetFiltersQuery } from './get-filters.query';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';

@QueryHandler(GetFiltersQuery)
export class GetFiltersHandler implements IQueryHandler<GetFiltersQuery> {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(_query: GetFiltersQuery) {
    return await this.bookRepository.getFilters();
  }
}
