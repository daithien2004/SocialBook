import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookErrorMessages } from '@/modules/books/application/error-messages';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { Book } from '@/modules/books/domain/books/entities/book.entity';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { GetBookByIdQuery } from './get-book-by-id.query';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';

import { BookViewedEvent } from '@/modules/analytics/application/public-api';
import { EventNames } from '@/shared/platform/constants/event-names.constant';

@QueryHandler(GetBookByIdQuery)
export class GetBookByIdHandler implements IQueryHandler<
  GetBookByIdQuery,
  Book
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly bookCache: IBookCachePort,
  ) {}

  async execute(query: GetBookByIdQuery): Promise<Book> {
    if (!query.id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const bookId = BookId.create(query.id);

    const cachedBook = await this.bookCache.getDetail(query.id);

    const book =
      cachedBook ??
      (await (async (): Promise<Book> => {
        const found = await this.bookRepository.findById(bookId);
        if (!found) {
          throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
        }
        await this.bookCache.setDetail(found);
        return found;
      })());

    // 4. Emit view event
    this.eventEmitter.emit(
      EventNames.BOOK_VIEWED,
      new BookViewedEvent(query.id),
    );

    return book;
  }
}
