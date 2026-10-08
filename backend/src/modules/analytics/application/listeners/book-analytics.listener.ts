import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { BookId } from '@/modules/books/domain/public-api';
import { BookViewedEvent } from '../events/book-viewed.event';
import { EventNames } from '@/common/constants/event-names.constant';

@Injectable()
export class BookAnalyticsListener {
  private readonly logger = new Logger(BookAnalyticsListener.name);

  constructor(private readonly bookRepository: IBookRepository) {}

  @OnEvent(EventNames.BOOK_VIEWED, { async: true })
  async handleBookViewedEvent(event: BookViewedEvent) {
    try {
      this.logger.debug(`Incrementing view count for book: ${event.bookId}`);
      await this.bookRepository.incrementViews(BookId.create(event.bookId));
    } catch (error) {
      this.logger.error(
        `Failed to increment view count for book ${event.bookId}`,
        error,
      );
    }
  }
}
