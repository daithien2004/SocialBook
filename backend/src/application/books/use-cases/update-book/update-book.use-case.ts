import { Injectable, Inject } from '@nestjs/common';
import {
  NotFoundDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';
import { UpdateBookCommand } from './update-book.command';
import { ErrorMessages } from '@/common/constants/error-messages';
import { BOOK_CACHE_SERVICE } from '@/domain/books/cache/book-cache.service.interface';
import type { IBookCacheService } from '@/domain/books/cache/book-cache.service.interface';

@Injectable()
export class UpdateBookUseCase {
  constructor(
    private readonly bookRepository: IBookRepository,
    @Inject(BOOK_CACHE_SERVICE) private readonly bookCache: IBookCacheService,
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

    // Sử dụng service chuyên biệt để cập nhật và xóa cache liên quan
    await this.bookCache.setDetail(book);
    await this.bookCache.invalidateDetail(book.id.toString(), book.slug);

    return book;
  }
}
