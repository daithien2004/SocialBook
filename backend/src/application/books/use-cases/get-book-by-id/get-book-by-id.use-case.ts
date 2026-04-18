import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorMessages } from '@/common/constants/error-messages';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { GetBookByIdQuery } from './get-book-by-id.query';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';

@Injectable()
export class GetBookByIdUseCase {
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) {}

  async execute(query: GetBookByIdQuery): Promise<Book> {
    if (!query.id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const bookId = BookId.create(query.id);
    const cacheKey = `books:detail:${query.id}`;

    const cached = await this.cache.get<unknown>(cacheKey);
    const cachedBook = this.tryReconstituteFromCache(cached);

    const book =
      cachedBook ??
      (await (async (): Promise<Book> => {
        const found = await this.bookRepository.findById(bookId);
        if (!found) {
          throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
        }
        await this.cache.set(cacheKey, this.toCacheSnapshot(found), this.CACHE_TTL);
        return found;
      })());

    // 4. Emit view event
    this.eventEmitter.emit('book.viewed', { bookId: query.id });

    return book;
  }

  private toCacheSnapshot(book: Book): BookCacheSnapshot {
    return {
      id: book.id.toString(),
      title: book.title.toString(),
      slug: book.slug,
      authorId: book.authorId.toString(),
      genres: book.genres.map((g) => g.toString()),
      description: book.description,
      publishedYear: book.publishedYear,
      coverUrl: book.coverUrl,
      status: book.status.toString() as BookCacheSnapshot['status'],
      tags: book.tags,
      views: book.views,
      likes: book.likes,
      likedBy: book.likedBy,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      authorName: book.authorName,
      chapterCount: book.chapterCount,
    };
  }

  private tryReconstituteFromCache(value: unknown): Book | null {
    if (!isBookCacheSnapshot(value)) return null;
    return Book.reconstitute({
      id: value.id,
      title: value.title,
      slug: value.slug,
      authorId: value.authorId,
      genres: value.genres,
      description: value.description,
      publishedYear: value.publishedYear,
      coverUrl: value.coverUrl,
      status: value.status,
      tags: value.tags,
      views: value.views,
      likes: value.likes,
      likedBy: value.likedBy,
      createdAt: new Date(value.createdAt),
      updatedAt: new Date(value.updatedAt),
      authorName: value.authorName,
      chapterCount: value.chapterCount,
    });
  }
}

type BookCacheSnapshot = {
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
  authorName?: string;
  chapterCount?: number;
};

function isBookCacheSnapshot(value: unknown): value is BookCacheSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.slug === 'string' &&
    typeof v.authorId === 'string' &&
    Array.isArray(v.genres) &&
    typeof v.description === 'string' &&
    typeof v.publishedYear === 'string' &&
    typeof v.coverUrl === 'string' &&
    (v.status === 'draft' || v.status === 'published' || v.status === 'completed') &&
    Array.isArray(v.tags) &&
    typeof v.views === 'number' &&
    typeof v.likes === 'number' &&
    Array.isArray(v.likedBy) &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string'
  );
}
