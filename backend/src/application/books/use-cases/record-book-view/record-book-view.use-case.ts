import { Injectable, Logger, Inject } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { RecordBookViewCommand } from './record-book-view.command';
import { BOOK_CACHE_SERVICE } from '@/domain/books/interfaces/book-cache.service.interface';
import type { IBookCacheService } from '@/domain/books/interfaces/book-cache.service.interface';
import { ErrorMessages } from '@/common/constants/error-messages';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';

function getISOWeek(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

@Injectable()
export class RecordBookViewUseCase {
  private readonly logger = new Logger(RecordBookViewUseCase.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    @Inject(BOOK_CACHE_SERVICE) private readonly bookCache: IBookCacheService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async execute(command: RecordBookViewCommand): Promise<void> {
    try {
      const book = await this.bookRepository.findBySlug(command.slug);
      if (!book) {
        throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
      }

      await this.bookRepository.incrementViews(book.id);

      // Record views in Redis
      const now = new Date();
      const monthKey = `views:monthly:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const weekKey = `views:weekly:${now.getFullYear()}-W${String(getISOWeek(now)).padStart(2, '0')}`;

      // We run these in background to not block the response
      Promise.all([
        this.redis.zincrby(monthKey, 1, book.id.toString()),
        this.redis.zincrby(weekKey, 1, book.id.toString()),
      ]).catch((err) => {
        this.logger.error(
          `Failed to record book view in Redis: ${book.id.toString()}`,
          err,
        );
      });

      this.logger.debug(
        `Successfully incremented views for book slug: ${command.slug}`,
      );

      await this.bookCache.invalidateDetail(book.id.toString(), command.slug);
    } catch (error) {
      this.logger.error(
        `Failed to increment views for book slug: ${command.slug}`,
        error,
      );
      throw error;
    }
  }
}
