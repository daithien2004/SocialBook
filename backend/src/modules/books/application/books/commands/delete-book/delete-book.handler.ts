import { Transactional } from '@nestjs-cls/transactional';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { randomUUID } from 'node:crypto';
import { BookOutboxPort } from '@/modules/books/application/public-api';
import { BookErrorMessages } from '@/modules/books/application/error-messages';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { ICachePort } from '@/shared/domain/cache.port';
import {
  BadRequestDomainException,
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';
import { ReadingRoomReferencePort } from '@/modules/reading-rooms';
import { DeleteBookCommand } from './delete-book.command';

@CommandHandler(DeleteBookCommand)
export class DeleteBookHandler implements ICommandHandler<
  DeleteBookCommand,
  void
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly cache: ICachePort,
    private readonly bookOutbox: BookOutboxPort,
    private readonly readingRoomReferences: ReadingRoomReferencePort,
  ) {}

  async execute(command: DeleteBookCommand): Promise<void> {
    if (!command.id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const slug = await this.deleteBook(command.id, command.actor);
    await this.cache.del(`books:detail:${command.id}`);
    await this.cache.del(`books:slug:${slug}`);
  }

  @Transactional()
  private async deleteBook(
    bookIdValue: string,
    commandActor: DeleteBookCommand['actor'],
  ): Promise<string> {
    const bookId = BookId.create(bookIdValue);
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
    }
    ForbiddenError.from(commandActor.ability).throwUnlessCan(
      'delete',
      subject('Book', {
        id: book.id.toString(),
        status: book.status.toString(),
        isDeleted: false,
      }),
    );

    if (await this.readingRoomReferences.hasActiveRoomForBook(bookIdValue)) {
      throw new ConflictDomainException(
        'Cannot delete a book that is used by an active reading room.',
      );
    }

    await this.bookRepository.softDelete(bookId, book.loadedVersion);
    await this.bookOutbox.append({
      id: randomUUID(),
      type: 'book.deleted',
      bookId: bookIdValue,
    });
    return book.slug.toString();
  }
}
