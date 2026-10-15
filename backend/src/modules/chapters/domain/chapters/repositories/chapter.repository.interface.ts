import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { Chapter } from '../entities/chapter.entity';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterId } from '../value-objects/chapter-id.vo';
import { ChapterTitle } from '../value-objects/chapter-title.vo';

export type ChapterSortField =
  'createdAt' | 'updatedAt' | 'title' | 'orderIndex' | 'viewsCount';

export interface ChapterFilter {
  title?: string;
  bookId?: string;
  orderIndex?: number;
}

export abstract class IChapterRepository {
  abstract findById(id: ChapterId): Promise<Chapter | null>;
  abstract findByIdAndBookId(
    id: ChapterId,
    bookId: BookId,
  ): Promise<Chapter | null>;
  abstract touchIfInBook(id: ChapterId, bookId: BookId): Promise<string | null>;
  abstract findByParagraphId(paragraphId: string): Promise<Chapter | null>;
  abstract findBySlug(slug: string, bookId: BookId): Promise<Chapter | null>;
  abstract findByBook(
    bookId: BookId,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<Chapter>>;
  abstract findFirstChapter(bookId: BookId): Promise<Chapter | null>;

  abstract save(chapter: Chapter): Promise<void>;
  abstract delete(id: ChapterId, expectedVersion: number): Promise<void>;

  abstract existsByTitle(
    title: ChapterTitle,
    bookId: BookId,
    excludeId?: ChapterId,
  ): Promise<boolean>;
  abstract existsByOrderIndex(
    orderIndex: number,
    bookId: BookId,
    excludeId?: ChapterId,
  ): Promise<boolean>;

  abstract incrementViewsBySlug(
    bookSlug: string,
    chapterSlug: string,
  ): Promise<void>;

  abstract getMaxOrderIndex(bookId: BookId): Promise<number>;
  abstract countTotal(): Promise<number>;
  abstract updateTtsStatus(
    chapterId: string,
    ttsStatus: 'pending' | 'processing' | 'completed' | 'failed',
    audioUrl?: string,
  ): Promise<void>;
}
