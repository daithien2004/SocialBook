import { Query } from '@nestjs/cqrs';
import { ErrorMessages } from "@/common/constants/error-messages";
import { BookDetailReadModel } from "@/domain/books/read-models/book-detail.read-model";
import { IBookQueryProvider } from "@/domain/books/repositories/book-query.provider.interface";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { BadRequestDomainException, NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { ICachePort } from "@/shared/domain/cache.port";
import { CACHE_TTL } from "@/common/constants/cache.constants";

export class GetBookBySlugQuery extends Query<BookDetailReadModel> {
  constructor(public readonly slug: string) { super(); }
}
