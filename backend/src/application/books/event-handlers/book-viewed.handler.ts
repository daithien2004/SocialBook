import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class BookViewedHandler {
    private readonly logger = new Logger(BookViewedHandler.name);

    constructor(
        private readonly bookRepository: IBookRepository
    ) { }

    @OnEvent('book.viewed', { async: true })
    async handleBookViewedEvent(payload: { bookId: string }) {
        this.logger.debug(`Received book.viewed event for bookId: ${payload.bookId}`);
        try {
            await this.bookRepository.incrementViews(BookId.create(payload.bookId));
            this.logger.debug(`Successfully incremented views for bookId: ${payload.bookId}`);
        } catch (error) {
            this.logger.error(`Failed to increment views for bookId: ${payload.bookId}`, error);
        }
    }
}
