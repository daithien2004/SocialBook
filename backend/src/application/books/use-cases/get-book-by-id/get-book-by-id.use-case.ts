import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { ErrorMessages } from '@/common/constants/error-messages';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';
import { GetBookByIdQuery } from './get-book-by-id.query';

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
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const bookId = BookId.create(query.id);
        const cacheKey = `books:detail:${query.id}`;

        let book: Book;

        // 1. Kiểm tra cache trước
        const cached = await this.cache.get<Book>(cacheKey);
        
        if (cached) {
            book = cached;
        } else {
            // 2. Không có cache thì query DB
            const found = await this.bookRepository.findById(bookId);
            if (!found) {
                throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
            }

            // 3. Set vào cache
            await this.cache.set(cacheKey, found, this.CACHE_TTL);
            book = found;
        }

        // 4. Gọi hàm tăng view chung ở dưới cùng (chỉ viết 1 lần) qua Event Emitter
        this.eventEmitter.emit('book.viewed', { bookId: query.id });
        
        return book;
    }

}
