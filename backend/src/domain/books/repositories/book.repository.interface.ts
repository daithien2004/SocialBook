import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { Book } from '../entities/book.entity';
import { AuthorId } from '../value-objects/author-id.vo';
import { BookId } from '../value-objects/book-id.vo';
import { BookTitle } from '../value-objects/book-title.vo';
import { GenreId } from '../value-objects/genre-id.vo';

export interface BookFilter {
    title?: string;
    authorId?: string;
    genres?: string[];
    tags?: string[];
    status?: 'draft' | 'published' | 'completed';
    search?: string;
    publishedYear?: string;
    ids?: string[];
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface SortOptions {
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'views' | 'likes' | 'publishedYear';
    order?: 'asc' | 'desc';
}

export abstract class IBookRepository {
    abstract findById(id: BookId): Promise<Book | null>;
    abstract findBySlug(slug: string): Promise<Book | null>;
    abstract findByTitle(title: BookTitle): Promise<Book | null>;
    abstract findAll(
        filter: BookFilter,
        pagination: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Book>>;
    abstract findByAuthor(
        authorId: AuthorId,
        pagination: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Book>>;
    abstract findByGenre(
        genreId: GenreId,
        pagination: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Book>>;
    abstract findPopular(pagination: PaginationOptions): Promise<PaginatedResult<Book>>;
    abstract findRecent(pagination: PaginationOptions): Promise<PaginatedResult<Book>>;

    abstract save(book: Book): Promise<void>;
    abstract delete(id: BookId): Promise<void>;
    abstract softDelete(id: BookId): Promise<void>;

    abstract existsByTitle(title: BookTitle, excludeId?: BookId): Promise<boolean>;
    abstract existsBySlug(slug: string, excludeId?: BookId): Promise<boolean>;
    abstract existsById(id: string): Promise<boolean>;

    abstract incrementViews(id: BookId): Promise<void>;
    abstract addLike(id: BookId, userId: string): Promise<void>;
    abstract removeLike(id: BookId, userId: string): Promise<void>;

    abstract countByAuthor(authorId: AuthorId): Promise<number>;
    abstract countByGenre(genreId: string): Promise<number>;
    abstract countByStatus(status: 'draft' | 'published' | 'completed'): Promise<number>;

    abstract countTotal(): Promise<number>;
    abstract countByGenreName(): Promise<Array<{ genre: string; count: number }>>;

    abstract findByIds(ids: BookId[]): Promise<Book[]>;
}
