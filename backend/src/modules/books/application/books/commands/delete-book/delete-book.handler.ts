import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { DeleteBookCommand } from './delete-book.command';
import { BookErrorMessages } from '@/modules/books/application/error-messages';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';
import { ICachePort } from '@/shared/domain/cache.port';
import { randomUUID } from 'node:crypto';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { BookOutboxPort } from '@/modules/books/application/public-api';

@CommandHandler(DeleteBookCommand)
export class DeleteBookHandler implements ICommandHandler<
  DeleteBookCommand,
  void
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly cache: ICachePort,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly bookOutbox: BookOutboxPort,
  ) {}

  async execute(command: DeleteBookCommand): Promise<void> {
    if (!command.id) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const bookId = BookId.create(command.id);
    const book = await this.bookRepository.findById(bookId);

    if (!book) {
      throw new NotFoundException(BookErrorMessages.BOOK_NOT_FOUND);
    }

    await this.unitOfWork.execute(async () => {
      await this.bookRepository.softDelete(bookId, book.loadedVersion);
      await this.bookOutbox.append({
        id: randomUUID(),
        type: 'book.deleted',
        bookId: command.id,
      });
    });

    // Ghi DB xong m?i xa cache  dng th? t?
    await this.cache.del(`books:detail:${command.id}`);
    await this.cache.del(`books:slug:${book.slug.toString()}`);
  }
}
