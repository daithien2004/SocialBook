import { ErrorMessages } from '@/common/constants/error-messages';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { Injectable } from '@nestjs/common';
import { BadRequestDomainException, NotFoundDomainException } from '@/shared/domain/common-exceptions';
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
            throw new BadRequestDomainException('Slug cannot be empty');
        }

        const book = await this.bookQueryProvider.findDetailBySlug(query.slug);

        if (!book) {
            throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
        }

        this.eventEmitter.emit('book.viewed', { bookId: book.id });

        return book;
    }
}
