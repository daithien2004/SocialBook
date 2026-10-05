import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  PaginationOptions,
  SortOptions,
} from '@/common/interfaces/pagination.interface';
import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { BookFilter } from '@/domain/books/repositories/book.repository.interface';
import { GetBooksQuery } from './get-books.query';

@QueryHandler(GetBooksQuery)
export class GetBooksHandler implements IQueryHandler<GetBooksQuery> {
  constructor(private readonly bookQueryProvider: IBookQueryProvider) {}

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

    return await this.bookQueryProvider.findAllList(filter, pagination, sort);
  }
}
