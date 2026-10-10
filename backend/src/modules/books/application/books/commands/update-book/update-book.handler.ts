import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import {
  NotFoundDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { Book } from '@/modules/books/domain/books/entities/book.entity';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/modules/books/domain/books/value-objects/book-title.vo';
import { UpdateBookCommand } from './update-book.command';
import { BookErrorMessages } from '@/modules/books/application/error-messages';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { randomUUID } from 'node:crypto';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { BookOutboxPort } from '@/modules/books/application/public-api';

@CommandHandler(UpdateBookCommand)
export class UpdateBookHandler implements ICommandHandler<
  UpdateBookCommand,
  Book
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly bookCache: IBookCachePort,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly bookOutbox: BookOutboxPort,
  ) {}

  async execute(command: UpdateBookCommand): Promise<Book> {
    const bookId = BookId.create(command.id);

    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
    }

    // Check if title is being updated and if it conflicts with existing book
    if (command.title && command.title.trim() !== book.title.toString()) {
      const newTitle = BookTitle.create(command.title);
      const exists = await this.bookRepository.existsByTitle(newTitle, bookId);

      if (exists) {
        throw new ConflictDomainException(
          'Book with this title already exists',
        );
      }

      book.changeTitle(command.title);
    }

    if (command.authorId !== undefined) {
      book.changeAuthor(command.authorId);
    }

    if (command.genres !== undefined) {
      if (command.genres.length === 0) {
        throw new BadRequestException('Book must have at least one genre');
      }

      if (command.genres.length > 5) {
        throw new BadRequestException('Book cannot have more than 5 genres');
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

    const persistedVersion = book.loadedVersion + (book.isDirty ? 1 : 0);
    await this.unitOfWork.execute(async () => {
      await this.bookRepository.save(book);
      await this.bookOutbox.append({
        id: randomUUID(),
        type: 'book.updated',
        bookId: book.id.toString(),
      });
    });
    book.markPersisted(persistedVersion);

    // Sá»­ dá»¥ng service chuyÃªn biá»‡t Ä‘á»ƒ cáº­p nháº­t vÃ  xÃ³a cache liÃªn quan
    await this.bookCache.setDetail(book);
    await this.bookCache.invalidateDetail(book.id.toString(), book.slug);

    return book;
  }
}
