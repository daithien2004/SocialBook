import { ErrorMessages } from '@/common/constants/error-messages';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetBookBySlugQuery } from './get-book-by-slug.query';

@Injectable()
export class GetBookBySlugUseCase {
    constructor(
        private readonly bookQueryProvider: IBookQueryProvider,
        private readonly eventEmitter: EventEmitter2
    ) { }

    async execute(query: GetBookBySlugQuery): Promise<BookDetailReadModel> {
        if (!query.slug) {
            throw new BadRequestException('Slug cannot be empty');
        }

        const book = await this.bookQueryProvider.findDetailBySlug(query.slug);

        if (!book) {
            throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
        }

        // Emit an event to increment views asynchronously (CQRS compliance)
        this.eventEmitter.emit('book.viewed', { bookId: book.id });

        return book;
    }
}
