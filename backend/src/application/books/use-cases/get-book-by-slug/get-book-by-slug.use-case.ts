import { ErrorMessages } from '@/common/constants/error-messages';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';
import { GetBookBySlugQuery } from './get-book-by-slug.query';

@Injectable()
export class GetBookBySlugUseCase {
    private readonly CACHE_TTL = 300;

    constructor(
        private readonly bookQueryProvider: IBookQueryProvider,
        private readonly eventEmitter: EventEmitter2,
        @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
    ) {}

    async execute(query: GetBookBySlugQuery): Promise<BookDetailReadModel> {
        if (!query.slug) {
            throw new BadRequestException('Slug cannot be empty');
        }

        const cacheKey = `books:slug:${query.slug}`;

        let viewBookId: string;
        let bookDetail: BookDetailReadModel;

        // 1. Kiểm tra cache trước
        const cached = await this.cache.get<BookDetailReadModel>(cacheKey);
        
        if (cached) {
            bookDetail = cached;
            viewBookId = cached.id;
        } else {
            // 2. Không có cache thì query DB
            const book = await this.bookQueryProvider.findDetailBySlug(query.slug);

            if (!book) {
                throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
            }

            // 3. Set vào cache
            await this.cache.set(cacheKey, book, this.CACHE_TTL);
            bookDetail = book;
            viewBookId = book.id;
        }

        // 4. Gọi hàm tăng view chung ở dưới cùng
        this.eventEmitter.emit('book.viewed', { bookId: viewBookId });
        
        return bookDetail;
    }
}
