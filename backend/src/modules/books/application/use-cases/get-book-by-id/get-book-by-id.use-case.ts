import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookRepository } from '../../../domain/repositories/book.repository.interface';
import { Book } from '../../../domain/entities/book.entity';
import { BookId } from '../../../domain/value-objects/book-id.vo';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class GetBookByIdUseCase {
    constructor(
        private readonly bookRepository: IBookRepository
    ) {}

    async execute(id: string): Promise<Book> {
        if (!id) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const bookId = BookId.create(id);
        const book = await this.bookRepository.findById(bookId);

        if (!book) {
            throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
        }

        // Increment views
        await this.bookRepository.incrementViews(bookId);

        return book;
    }
}
