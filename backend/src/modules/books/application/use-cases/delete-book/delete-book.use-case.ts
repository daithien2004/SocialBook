import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookRepository } from '../../../domain/repositories/book.repository.interface';
import { BookId } from '../../../domain/value-objects/book-id.vo';
import { DeleteBookCommand } from './delete-book.command';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class DeleteBookUseCase {
    constructor(
        private readonly bookRepository: IBookRepository
    ) {}

    async execute(command: DeleteBookCommand): Promise<void> {
        if (!command.id) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const bookId = BookId.create(command.id);
        const book = await this.bookRepository.findById(bookId);

        if (!book) {
            throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
        }

        await this.bookRepository.softDelete(bookId);
    }
}
