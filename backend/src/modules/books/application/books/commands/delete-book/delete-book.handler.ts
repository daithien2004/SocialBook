import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { DeleteBookCommand } from './delete-book.command';
import { ErrorMessages } from '@/common/constants/error-messages';
import { ICachePort } from '@/shared/domain/cache.port';
import { EventNames } from '@/common/constants/event-names.constant';

@CommandHandler(DeleteBookCommand)
export class DeleteBookHandler implements ICommandHandler<
  DeleteBookCommand,
  void
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly cache: ICachePort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: DeleteBookCommand): Promise<void> {
    if (!command.id) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const bookId = BookId.create(command.id);
    const book = await this.bookRepository.findById(bookId);

    if (!book) {
      throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
    }

    await this.bookRepository.softDelete(bookId);

    // Ghi DB xong m?i xa cache  dng th? t?
    await this.cache.del(`books:detail:${command.id}`);
    await this.cache.del(`books:slug:${book.slug.toString()}`);

    this.eventEmitter.emit(EventNames.BOOK_DELETED, { bookId: command.id });
  }
}
