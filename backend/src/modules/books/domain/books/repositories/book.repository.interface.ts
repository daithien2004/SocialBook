import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { Book } from '../entities/book.entity';
import { BookId } from '../value-objects/book-id.vo';
import { BookTitle } from '../value-objects/book-title.vo';
import { GenreId } from '../value-objects/genre-id.vo';

export type BookSortField =
  'createdAt' | 'updatedAt' | 'title' | 'views' | 'likes' | 'publishedYear';

export interface BookFilter {
  title?: string;
  authorId?: string;
  authorIds?: string[];
  genres?: string[];
  tags?: string[];
  status?: 'draft' | 'published' | 'completed';
  search?: string;
  publishedYear?: string;
  ids?: string[];
}

export abstract class IBookRepository {
  abstract findById(id: BookId): Promise<Book | null>;
  abstract findBySlug(slug: string): Promise<Book | null>;
  abstract findUnindexedBooks(limit: number): Promise<Book[]>;
  abstract findByGenre(
    genreId: GenreId,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<Book>>;
  abstract findPopular(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Book>>;

  abstract save(book: Book): Promise<void>;
  abstract delete(id: BookId, expectedVersion: number): Promise<void>;
  abstract softDelete(id: BookId, expectedVersion: number): Promise<void>;

  abstract existsByTitle(
    title: BookTitle,
    excludeId?: BookId,
  ): Promise<boolean>;
  abstract existsById(id: string): Promise<boolean>;
  abstract touchIfActive(id: BookId): Promise<boolean>;

  abstract incrementViews(id: BookId): Promise<void>;
  abstract addLike(id: BookId, userId: string): Promise<void>;
  abstract removeLike(id: BookId, userId: string): Promise<void>;

  abstract countByGenre(genreId: string): Promise<number>;

  abstract countTotal(): Promise<number>;
  abstract findByIds(ids: BookId[]): Promise<Book[]>;
}
