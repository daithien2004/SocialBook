import { Transactional } from '@nestjs-cls/transactional';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { randomUUID } from 'node:crypto';
import {
  BadRequestDomainException,
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
import { IMediaPort } from '@/modules/media/domain/public-api';
import { UpdateBookCommand } from './update-book.command';

@CommandHandler(UpdateBookCommand)
export class UpdateBookHandler implements ICommandHandler<
  UpdateBookCommand,
  string
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly bookCache: IBookCachePort,
    private readonly bookOutbox: BookOutboxPort,
    private readonly media: IMediaPort,
  ) {}

  async execute(command: UpdateBookCommand): Promise<string> {
    // Check access before uploading a file so a rejected update cannot create an orphaned media asset.
    await this.assertCanUpdate(command);
    const coverUrl = command.coverFile
      ? await this.media.uploadImage(command.coverFile)
      : command.coverUrl;
    const book = await this.updateBook(command, coverUrl);
    await this.bookCache.setDetail(book);
    await this.bookCache.invalidateDetail(book.id.toString(), book.slug);
    return book.id.toString();
  }

  private async assertCanUpdate(command: UpdateBookCommand): Promise<void> {
    const book = await this.bookRepository.findById(BookId.create(command.id));
    if (!book) {
      throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('Book', {
        id: book.id.toString(),
        status: book.status.toString(),
        isDeleted: false,
      }),
    );
  }

  @Transactional()
  private async updateBook(
    command: UpdateBookCommand,
    coverUrl?: string,
  ): Promise<Book> {
    const bookId = BookId.create(command.id);
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('Book', {
        id: book.id.toString(),
        status: book.status.toString(),
        isDeleted: false,
      }),
    );

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
        throw new BadRequestDomainException(
          'Book must have at least one genre',
        );
      }
      if (command.genres.length > 5) {
        throw new BadRequestDomainException(
          'Book cannot have more than 5 genres',
        );
      }
      book.updateGenres(command.genres);
    }
    if (command.description !== undefined) {
      book.updateDescription(command.description);
    }
    if (command.publishedYear !== undefined) {
      book.updatePublishedYear(command.publishedYear);
    }
    if (coverUrl !== undefined) book.updateCoverUrl(coverUrl);
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
