import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import type { AppAbility } from '@/shared/casl/app-ability';
import { BookDetailReadModel } from '../read-models/book-detail.read-model';
import { BookListReadModel } from '../read-models/book-list.read-model';
import { BookFiltersReadModel } from '../read-models/book-filters.read-model';
import { BookFilter } from '../../domain/books/repositories/book.repository.interface';

export abstract class BookReadRepository {
  abstract findAllList(
    ability: AppAbility,
    filter: BookFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookListReadModel>>;

  abstract findListById(
    ability: AppAbility,
    id: string,
  ): Promise<BookListReadModel | null>;

  abstract findDetailBySlug(
    ability: AppAbility,
    slug: string,
  ): Promise<BookDetailReadModel | null>;

  abstract getFilters(ability: AppAbility): Promise<BookFiltersReadModel>;
}
