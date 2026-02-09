import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { ErrorMessages } from '@/common/constants/error-messages';
import { GetBookByIdQuery } from './get-book-by-id.query';

@Injectable()
export class GetBookByIdUseCase {
    constructor(
        private readonly bookRepository: IBookRepository
    ) { }

    async execute(query: GetBookByIdQuery): Promise<Book> {
        if (!query.id) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const bookId = BookId.create(query.id);
        const book = await this.bookRepository.findById(bookId);

        if (!book) {
            throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
        }

        await this.bookRepository.incrementViews(bookId);

        return book;
    }
}
