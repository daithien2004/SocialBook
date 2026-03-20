import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorMessages } from '@/common/constants/error-messages';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { GetBookByIdQuery } from './get-book-by-id.query';
import { BadRequestDomainException, NotFoundDomainException } from '@/shared/domain/common-exceptions';

@Injectable()
export class GetBookByIdUseCase {
    private readonly CACHE_TTL = 300;

    constructor(
        private readonly bookRepository: IBookRepository,
        private readonly eventEmitter: EventEmitter2,
        @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
    ) {}

    async execute(query: GetBookByIdQuery): Promise<Book> {
        if (!query.id) {
            throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
        }

        const bookId = BookId.create(query.id);
        const cacheKey = `books:detail:${query.id}`;

        let book: Book;

        // 1. Check cache first
        const cached = await this.cache.get<Book>(cacheKey);

        if (cached) {
            book = cached;
        } else {
            // 2. Cache miss -> query DB
            const found = await this.bookRepository.findById(bookId);
            if (!found) {
                throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
            }

            // 3. Set cache
            await this.cache.set(cacheKey, found, this.CACHE_TTL);
            book = found;
        }

        // 4. Emit view event
        this.eventEmitter.emit('book.viewed', { bookId: query.id });

        return book;
    }
}
