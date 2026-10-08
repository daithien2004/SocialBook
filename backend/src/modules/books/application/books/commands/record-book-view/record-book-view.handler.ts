import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { RecordBookViewCommand } from './record-book-view.command';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { IViewRankingCachePort } from '@/modules/books/domain/books/interfaces/view-ranking-cache.port';
import { BookErrorMessages } from '@/modules/books/application/error-messages';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

@CommandHandler(RecordBookViewCommand)
export class RecordBookViewHandler implements ICommandHandler<
  RecordBookViewCommand,
  void
> {
  private readonly logger = new Logger(RecordBookViewHandler.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly bookCache: IBookCachePort,
    private readonly viewRankingCache: IViewRankingCachePort,
  ) {}

  async execute(command: RecordBookViewCommand): Promise<void> {
    try {
      const book = await this.bookRepository.findBySlug(command.slug);
      if (!book) {
        throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
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
