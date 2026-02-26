import { BookFilter, IBookRepository, PaginationOptions, SortOptions } from '@/domain/books/repositories/book.repository.interface';
import { Injectable } from '@nestjs/common';
import { GetBooksQuery } from './get-books.query';

@Injectable()
export class GetBooksUseCase {
    constructor(
        private readonly bookRepository: IBookRepository
    ) { }

    async execute(query: GetBooksQuery) {
        const filter: BookFilter = {
            title: query.title,
            authorId: query.authorId,
            genres: query.genres,
            tags: query.tags,
            status: query.status,
            search: query.search,
            publishedYear: query.publishedYear
        };

        const pagination: PaginationOptions = {
            page: query.page,
            limit: query.limit
        };

        const sort: SortOptions = {
            sortBy: query.sortBy,
            order: query.order
        };

        return await this.bookRepository.findAllList(filter, pagination, sort);
    }
}


