import { ErrorMessages } from '@/common/constants/error-messages';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { Injectable, Inject } from '@nestjs/common';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import type { ICacheService } from '@/domain/shared/interfaces/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/interfaces/cache.service.interface';
import { CACHE_TTL } from '@/common/constants/cache.constants';
import { GetBookBySlugQuery } from './get-book-by-slug.query';

@Injectable()
export class GetBookBySlugUseCase {
  constructor(
    private readonly bookQueryProvider: IBookQueryProvider,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(query: GetBookBySlugQuery): Promise<BookDetailReadModel> {
    if (!query.slug) {
      throw new BadRequestDomainException('Slug cannot be empty');
    }

    const cacheKey = `books:slug:${query.slug}`;

    const cached = await this.cache.get<BookDetailReadModel>(cacheKey);

    if (cached) {
      return cached;
    }

    const book = await this.bookQueryProvider.findDetailBySlug(query.slug);

    if (!book) {
      throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
    }

    const ratingStats = await this.reviewRepository.getStatsForBooks([book.id]);
    const stats = ratingStats.get(book.id);
    if (stats) {
      book.stats.averageRating = stats.rating;
      book.stats.totalRatings = stats.count;
    }

    await this.cache.set(cacheKey, book, CACHE_TTL.DEFAULT);

    return book;
  }
}
