import { Query } from '@nestjs/cqrs';
import { ErrorMessages } from "@/common/constants/error-messages";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { Book } from "@/domain/books/entities/book.entity";
import { BookId } from "@/domain/books/value-objects/book-id.vo";
import { IBookCachePort } from "@/domain/books/interfaces/book-cache.port";
import { BadRequestDomainException, NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { BookViewedEvent } from "@/application/analytics/events/book-viewed.event";
import { EventNames } from "@/common/constants/event-names.constant";

export class GetBookByIdQuery extends Query<Book> {
  constructor(public readonly id: string) { super(); }
}
