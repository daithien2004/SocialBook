import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { Chapter } from '../entities/chapter.entity';
import { ChapterId } from '../value-objects/chapter-id.vo';
import { ChapterTitle } from '../value-objects/chapter-title.vo';
import { BookId } from '../value-objects/book-id.vo';

export interface ChapterFilter {
    title?: string;
    bookId?: string;
    orderIndex?: number;
    minWordCount?: number;
    maxWordCount?: number;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface SortOptions {
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'orderIndex' | 'viewsCount';
    order?: 'asc' | 'desc';
}

export abstract class IChapterRepository {
    abstract findById(id: ChapterId): Promise<Chapter | null>;
    abstract findBySlug(slug: string, bookId: BookId): Promise<Chapter | null>;
    abstract findByTitle(title: ChapterTitle, bookId: BookId): Promise<Chapter | null>;
    abstract findAll(
        filter: ChapterFilter,
        pagination: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Chapter>>;
    abstract findByBook(
        bookId: BookId,
        pagination: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Chapter>>;
    abstract findByBookSlug(
        bookSlug: string,
        pagination: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<Chapter>>;
    abstract findNextChapter(
        bookId: BookId,
        currentOrderIndex: number
    ): Promise<Chapter | null>;
    abstract findPreviousChapter(
        bookId: BookId,
        currentOrderIndex: number
    ): Promise<Chapter | null>;
    abstract findFirstChapter(bookId: BookId): Promise<Chapter | null>;
    abstract findLastChapter(bookId: BookId): Promise<Chapter | null>;
    
    abstract save(chapter: Chapter): Promise<void>;
    abstract delete(id: ChapterId): Promise<void>;
    
    abstract existsByTitle(title: ChapterTitle, bookId: BookId, excludeId?: ChapterId): Promise<boolean>;
    abstract existsBySlug(slug: string, bookId: BookId, excludeId?: ChapterId): Promise<boolean>;
    abstract existsByOrderIndex(orderIndex: number, bookId: BookId, excludeId?: ChapterId): Promise<boolean>;
    
    abstract incrementViews(id: ChapterId): Promise<void>;
    
    abstract countByBook(bookId: BookId): Promise<number>;
    abstract getTotalViewsByBook(bookId: BookId): Promise<number>;
    abstract getTotalWordsByBook(bookId: BookId): Promise<number>;
    
    abstract getMaxOrderIndex(bookId: BookId): Promise<number>;
    abstract reorderChapters(bookId: BookId, chapterOrders: Array<{ id: string; orderIndex: number }>): Promise<void>;
    abstract countChaptersForBooks(bookIds: string[]): Promise<Map<string, number>>;
    abstract countTotal(): Promise<number>;
}
