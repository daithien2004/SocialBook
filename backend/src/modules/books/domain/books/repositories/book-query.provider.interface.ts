import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { BookDetailReadModel } from '../read-models/book-detail.read-model';
import { BookListReadModel } from '../read-models/book-list.read-model';
import { BookFilter } from './book.repository.interface';

export abstract class IBookQueryProvider {
  abstract findAllList(
    filter: BookFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookListReadModel>>;

  abstract findDetailBySlug(slug: string): Promise<BookDetailReadModel | null>;

  abstract getGrowthMetrics(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<Array<{ _id: string; count: number }>>;
}
