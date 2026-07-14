import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IBookCacheService } from '@/domain/books/interfaces/book-cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/interfaces/cache.service.interface';
import type { ICacheService } from '@/domain/shared/interfaces/cache.service.interface';
import { CACHE_TTL } from '@/common/constants/cache.constants';
import { Book } from '@/domain/books/entities/book.entity';

interface BookCacheData {
  id: string;
  title: string;
  slug: string;
  authorId: string;
  genres: string[];
  description: string;
  publishedYear: string;
  coverUrl: string;
  status: 'draft' | 'published' | 'completed';
  tags: string[];
  views: number;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
  authorName: string;
  chapterCount: number;
}

@Injectable()
export class BookCacheService implements IBookCacheService {
  private readonly logger = new Logger(BookCacheService.name);

  constructor(@Inject(CACHE_SERVICE) private readonly cache: ICacheService) {}

  async getDetail(bookId: string): Promise<Book | null> {
    const key = `books:detail:${bookId}`;
    const value = await this.cache.get<BookCacheData>(key);

    if (!value || typeof value !== 'object') {
      return null;
    }

    try {
      return Book.reconstitute({
        ...value,
        createdAt: new Date(value.createdAt),
        updatedAt: new Date(value.updatedAt),
      });
    } catch (e) {
      this.logger.warn(
        'Failed to reconstitute book from cache, falling back to DB query',
        e,
      );
      return null;
    }
  }

  async setDetail(book: Book): Promise<void> {
    const key = `books:detail:${book.id.toString()}`;

    const cacheData = {
      id: book.id.toString(),
      title: book.title.toString(),
      slug: book.slug,
      authorId: book.authorId.toString(),
      genres: book.genres.map((g) => g.toString()),
      description: book.description,
      publishedYear: book.publishedYear,
      coverUrl: book.coverUrl,
      status: book.status.toString(),
      tags: book.tags,
      views: book.views,
      likes: book.likes,
      likedBy: book.likedBy,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      authorName: book.authorName,
      chapterCount: book.chapterCount,
    };

    await this.cache.set(key, cacheData, CACHE_TTL.DEFAULT);
  }

  async invalidateDetail(bookId: string, slug?: string): Promise<void> {
    await this.cache.del(`books:detail:${bookId}`);
    if (slug) {
      await this.cache.del(`books:slug:${slug}`);
    }
  }
}
