import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { BookReadRepository } from '@/modules/books/application/ports/book-read.repository';
import { BookFilter } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { GetBooksQuery } from './get-books.query';

@QueryHandler(GetBooksQuery)
export class GetBooksHandler implements IQueryHandler<GetBooksQuery> {
  constructor(private readonly bookQueryProvider: BookReadRepository) {}

  async execute(query: GetBooksQuery) {
    const filter: BookFilter = {
      title: query.title,
      authorId: query.authorId,
      genres: query.genres,
      tags: query.tags,
      status: query.status,
      search: query.search,
      publishedYear: query.publishedYear,
    };

    const pagination: PaginationOptions = {
      page: query.page,
      limit: query.limit,
    };

    const sort: SortOptions = {
      sortBy: query.sortBy,
      order: query.order,
    };

    return this.bookQueryProvider.findAllList(
      query.actor.ability,
      filter,
      pagination,
      sort,
    );
  }
}
