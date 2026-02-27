import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { BookDetailReadModel } from '../read-models/book-detail.read-model';
import { BookListReadModel } from '../read-models/book-list.read-model';
import { BookId } from '../value-objects/book-id.vo';
import { BookFilter, PaginationOptions, SortOptions } from './book.repository.interface';

export abstract class IBookQueryProvider {
    abstract findAllList(
        filter: BookFilter,
        pagination: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<BookListReadModel>>;

    abstract findDetailBySlug(slug: string): Promise<BookDetailReadModel | null>;

    abstract searchFuzzy(query: string, limit?: number): Promise<Array<{ id: BookId; score: number; matchType: string }>>;

    abstract searchByDescription(keywords: string[], limit?: number): Promise<Array<{ id: BookId; score: number }>>;

    abstract getGrowthMetrics(startDate: Date, groupBy: 'day' | 'month' | 'year'): Promise<Array<{ _id: string; count: number }>>;
}
