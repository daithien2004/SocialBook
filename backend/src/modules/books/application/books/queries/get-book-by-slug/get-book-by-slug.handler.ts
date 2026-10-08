import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ErrorMessages } from '@/common/constants/error-messages';
import { BookDetailReadModel } from '@/modules/books/domain/books/read-models/book-detail.read-model';
import { IBookQueryProvider } from '@/modules/books/domain/books/repositories/book-query.provider.interface';
import { IReviewRepository } from '@/modules/reviews/domain/public-api';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { ICachePort } from '@/shared/domain/cache.port';
import { CACHE_TTL } from '@/common/constants/cache.constants';
import { GetBookBySlugQuery } from './get-book-by-slug.query';

@QueryHandler(GetBookBySlugQuery)
export class GetBookBySlugHandler implements IQueryHandler<
  GetBookBySlugQuery,
  BookDetailReadModel
> {
  constructor(
    private readonly bookQueryProvider: IBookQueryProvider,
    private readonly cache: ICachePort,
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
