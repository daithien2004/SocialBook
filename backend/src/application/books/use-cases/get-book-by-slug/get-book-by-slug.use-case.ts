import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class GetBookBySlugUseCase {
    constructor(
        private readonly bookRepository: IBookRepository
    ) { }

    async execute(slug: string): Promise<Book> {
        if (!slug) {
            throw new BadRequestException('Slug cannot be empty');
        }

        const book = await this.bookRepository.findBySlug(slug);

        if (!book) {
            throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
        }

        await this.bookRepository.incrementViews(book.id);

        return book;
    }
}


