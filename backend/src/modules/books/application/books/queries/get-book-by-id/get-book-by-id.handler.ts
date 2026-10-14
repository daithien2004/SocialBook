import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BookErrorMessages } from '@/modules/books/application/error-messages';
import { BookReadRepository } from '@/modules/books/application/ports/book-read.repository';
import { BookListReadModel } from '@/modules/books/application/read-models/book-list.read-model';
import { GetBookByIdQuery } from './get-book-by-id.query';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';

@QueryHandler(GetBookByIdQuery)
export class GetBookByIdHandler implements IQueryHandler<
  GetBookByIdQuery,
  BookListReadModel
> {
  constructor(private readonly bookReadRepository: BookReadRepository) {}

  async execute(query: GetBookByIdQuery): Promise<BookListReadModel> {
    if (!query.id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const book = await this.bookReadRepository.findListById(
      query.actor.ability,
      query.id,
    );
    if (!book) {
      throw new NotFoundDomainException(BookErrorMessages.BOOK_NOT_FOUND);
    }
    return book;
  }
}
