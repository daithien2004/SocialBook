import { ErrorMessages } from '@/common/constants/error-messages';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GetBookBySlugQuery } from './get-book-by-slug.query';

@Injectable()
export class GetBookBySlugUseCase {
    constructor(
        private readonly bookRepository: IBookRepository
    ) { }

    async execute(query: GetBookBySlugQuery): Promise<BookDetailReadModel> {
        if (!query.slug) {
            throw new BadRequestException('Slug cannot be empty');
        }

        const book = await this.bookRepository.findDetailBySlug(query.slug);

        if (!book) {
            throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
        }

        await this.bookRepository.incrementViews(BookId.create(book.id));

        return book;
    }
}
