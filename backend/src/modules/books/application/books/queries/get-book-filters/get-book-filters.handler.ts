import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { GetBookFiltersQuery } from './get-book-filters.query';

@QueryHandler(GetBookFiltersQuery)
export class GetBookFiltersHandler implements IQueryHandler<GetBookFiltersQuery> {
  private readonly logger = new Logger(GetBookFiltersHandler.name);

  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(_query: GetBookFiltersQuery) {
    _query;
    try {
      const [genres, tags] = await Promise.all([
        this.bookRepository.countByGenreName(),
        this.bookRepository.countByTags(),
      ]);

      return {
        genres,
        tags,
      };
    } catch (error) {
      this.logger.error('Failed to get book filters', error);
      throw error;
    }
  }
}
