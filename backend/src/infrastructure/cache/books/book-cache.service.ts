import { Injectable, Inject } from '@nestjs/common';
import type { IBookCacheService } from '@/domain/books/cache/book-cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { Book } from '@/domain/books/entities/book.entity';

@Injectable()
export class BookCacheService implements IBookCacheService {
  private readonly TTL = 300;

  constructor(
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) {}

  async getDetail(bookId: string): Promise<Book | null> {
    const key = `books:detail:${bookId}`;
    const value = await this.cache.get<any>(key);
    
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
      // Nếu dữ liệu cache bị hỏng hoặc thiếu field quan trọng, trả về null để query lại DB
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

    await this.cache.set(key, cacheData, this.TTL);
  }

  async invalidateDetail(bookId: string, slug?: string): Promise<void> {
    await this.cache.del(`books:detail:${bookId}`);
    if (slug) {
      await this.cache.del(`books:slug:${slug}`);
    }
  }
}

