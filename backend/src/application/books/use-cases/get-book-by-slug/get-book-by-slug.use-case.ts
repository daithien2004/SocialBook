import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { GetBookBySlugQuery } from './get-book-by-slug.query';

@Injectable()
export class GetBookBySlugUseCase {
    constructor(
        private readonly bookRepository: IBookRepository
    ) { }

    async execute(query: GetBookBySlugQuery): Promise<Book> {
        if (!query.slug) {
            throw new BadRequestException('Slug cannot be empty');
        }

        const book = await this.bookRepository.findBySlug(query.slug);

        if (!book) {
            throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
        }

        await this.bookRepository.incrementViews(book.id);

        return book;
    }
}
