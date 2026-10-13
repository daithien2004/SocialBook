import { BadRequestException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { BookOutboxPort } from '@/modules/books/application/public-api';
import { BookErrorMessages } from '@/modules/books/application/error-messages';
import { Book } from '@/modules/books/domain/books/entities/book.entity';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/modules/books/domain/books/value-objects/book-title.vo';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { UpdateBookCommand } from './update-book.command';

@CommandHandler(UpdateBookCommand)
export class UpdateBookHandler implements ICommandHandler<
  UpdateBookCommand,
  Book
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly bookCache: IBookCachePort,
    private readonly bookOutbox: BookOutboxPort,
  ) {}

  async execute(command: UpdateBookCommand): Promise<Book> {
    const book = await this.updateBook(command);
    await this.bookCache.setDetail(book);
    await this.bookCache.invalidateDetail(book.id.toString(), book.slug);
    return book;
  }

  @Transactional()
  private async updateBook(command: UpdateBookCommand): Promise<Book> {
    const bookId = BookId.create(command.id);
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
    }

    if (command.title && command.title.trim() !== book.title.toString()) {
      const newTitle = BookTitle.create(command.title);
      if (await this.bookRepository.existsByTitle(newTitle, bookId)) {
        throw new ConflictDomainException(
          'Book with this title already exists',
        );
      }
      book.changeTitle(command.title);
    }
    if (command.authorId !== undefined) book.changeAuthor(command.authorId);

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
    if (command.coverUrl !== undefined) book.updateCoverUrl(command.coverUrl);
    if (command.status !== undefined) book.changeStatus(command.status);
    if (command.tags !== undefined) book.updateTags(command.tags);

    await this.bookRepository.save(book);
    await this.bookOutbox.append({
      id: randomUUID(),
      type: 'book.updated',
      bookId: book.id.toString(),
    });
    return book;
  }
}
