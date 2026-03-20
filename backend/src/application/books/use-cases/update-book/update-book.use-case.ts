import { Injectable, Inject } from '@nestjs/common';
import { NotFoundDomainException, ConflictDomainException, BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';
import { UpdateBookCommand } from './update-book.command';
import { ErrorMessages } from '@/common/constants/error-messages';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';

@Injectable()
export class UpdateBookUseCase {
    constructor(
        private readonly bookRepository: IBookRepository,
        @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
    ) {}

    async execute(command: UpdateBookCommand): Promise<Book> {
        const bookId = BookId.create(command.id);
        
        const book = await this.bookRepository.findById(bookId);
        if (!book) {
            throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
        }

        // Check if title is being updated and if it conflicts with existing book
        if (command.title && command.title.trim() !== book.title.toString()) {
            const newTitle = BookTitle.create(command.title);
            const exists = await this.bookRepository.existsByTitle(newTitle, bookId);
            
            if (exists) {
                throw new ConflictDomainException('Book with this title already exists');
            }
            
            book.changeTitle(command.title);
        }

        if (command.authorId !== undefined) {
            book.changeAuthor(command.authorId);
        }

        if (command.genres !== undefined) {
            if (command.genres.length === 0) {
                throw new Error('Book must have at least one genre');
            }
            
            if (command.genres.length > 5) {
                throw new Error('Book cannot have more than 5 genres');
            }
            
            book.updateGenres(command.genres);
        }

        if (command.description !== undefined) {
            book.updateDescription(command.description);
        }

        if (command.publishedYear !== undefined) {
            book.updatePublishedYear(command.publishedYear);
        }

        if (command.coverUrl !== undefined) {
            book.updateCoverUrl(command.coverUrl);
        }

        if (command.status !== undefined) {
            book.changeStatus(command.status);
        }

        if (command.tags !== undefined) {
            book.updateTags(command.tags);
        }

        await this.bookRepository.save(book);

        // Ghi DB xong mới xóa cache — đúng thứ tự
        // Xóa cả 2 key vì frontend có thể dùng id hoặc slug
        await this.cache.del(`books:detail:${command.id}`);
        await this.cache.del(`books:slug:${book.slug.toString()}`);

        return book;
    }
}


