import { Injectable, Logger } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { RecordBookViewCommand } from './record-book-view.command';
import { IBookCachePort } from '@/domain/books/interfaces/book-cache.port';
import { IViewRankingCachePort } from '@/domain/books/interfaces/view-ranking-cache.port';
import { ErrorMessages } from '@/common/constants/error-messages';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

@Injectable()
export class RecordBookViewUseCase {
  private readonly logger = new Logger(RecordBookViewUseCase.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly bookCache: IBookCachePort,
    private readonly viewRankingCache: IViewRankingCachePort,
  ) {}

  async execute(command: RecordBookViewCommand): Promise<void> {
    try {
      const book = await this.bookRepository.findBySlug(command.slug);
      if (!book) {
        throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
      }

      await this.bookRepository.incrementViews(book.id);

      // Record views in Redis
      await this.viewRankingCache.recordView(book.id.toString());

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
