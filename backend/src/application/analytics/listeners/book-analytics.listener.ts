import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookViewedEvent } from '../events/book-viewed.event';

@Injectable()
export class BookAnalyticsListener {
  private readonly logger = new Logger(BookAnalyticsListener.name);

  constructor(private readonly bookRepository: IBookRepository) {}

  @OnEvent('book.viewed', { async: true })
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
