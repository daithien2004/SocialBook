import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { DeleteBookCommand } from './delete-book.command';
import { ErrorMessages } from '@/common/constants/error-messages';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';

@Injectable()
export class DeleteBookUseCase {
    constructor(
        private readonly bookRepository: IBookRepository,
        @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
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

        // Ghi DB xong mới xóa cache — đúng thứ tự
        await this.cache.del(`books:detail:${command.id}`);
        await this.cache.del(`books:slug:${book.slug.toString()}`);
    }
}


