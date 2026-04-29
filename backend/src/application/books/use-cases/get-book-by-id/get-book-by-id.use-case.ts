import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorMessages } from '@/common/constants/error-messages';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BOOK_CACHE_SERVICE } from '@/domain/books/cache/book-cache.service.interface';
import type { IBookCacheService } from '@/domain/books/cache/book-cache.service.interface';
import { GetBookByIdQuery } from './get-book-by-id.query';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';

@Injectable()
export class GetBookByIdUseCase {

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(BOOK_CACHE_SERVICE) private readonly bookCache: IBookCacheService,
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
          throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
        }
        await this.bookCache.setDetail(found);
        return found;
      })());

    // 4. Emit view event
    this.eventEmitter.emit('book.viewed', { bookId: query.id });

    return book;
  }
}

