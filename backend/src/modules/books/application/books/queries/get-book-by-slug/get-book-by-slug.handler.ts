import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { subject } from '@casl/ability';
import { BookErrorMessages } from '@/modules/books/application/error-messages';
import { BookDetailReadModel } from '@/modules/books/application/read-models/book-detail.read-model';
import { BookReadRepository } from '@/modules/books/application/ports/book-read.repository';
import { IReviewRepository } from '@/modules/reviews/domain/public-api';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { ICachePort } from '@/shared/domain/cache.port';
import { CACHE_TTL } from '@/shared/platform/constants/cache.constants';
import { GetBookBySlugQuery } from './get-book-by-slug.query';

@QueryHandler(GetBookBySlugQuery)
export class GetBookBySlugHandler implements IQueryHandler<
  GetBookBySlugQuery,
  BookDetailReadModel
> {
  constructor(
    private readonly bookQueryProvider: BookReadRepository,
    private readonly cache: ICachePort,
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(query: GetBookBySlugQuery): Promise<BookDetailReadModel> {
    if (!query.slug) {
      throw new BadRequestDomainException('Slug cannot be empty');
    }

    const cacheKey = `books:slug:${query.slug}`;

    const cached = await this.cache.get<BookDetailReadModel>(cacheKey);
    const book =
      cached ??
      (await this.bookQueryProvider.findDetailBySlug(
        query.actor.ability,
        query.slug,
      ));

    if (!book) {
      throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
    }

    if (
      !query.actor.ability.can(
        'read',
        subject('Book', {
          id: book.id,
          status: book.status,
          isDeleted: false,
        }),
      )
    ) {
      throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
    }

    if (!cached) {
      const ratingStats = await this.reviewRepository.getStatsForBooks([
        book.id,
      ]);
      const stats = ratingStats.get(book.id);
      if (stats) {
        book.stats.averageRating = stats.rating;
        book.stats.totalRatings = stats.count;
      }
      await this.cache.set(cacheKey, book, CACHE_TTL.DEFAULT);
    }

    return book;
  }
}
