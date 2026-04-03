import { Injectable } from '@nestjs/common';
import {
  NotFoundDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { Author } from '@/domain/authors/entities/author.entity';
import { AuthorId } from '@/domain/authors/value-objects/author-id.vo';
import { ErrorMessages } from '@/common/constants/error-messages';
import { GetAuthorByIdQuery } from './get-author-by-id.query';

@Injectable()
export class GetAuthorByIdUseCase {
  constructor(private readonly authorRepository: IAuthorRepository) {}

  async execute(query: GetAuthorByIdQuery): Promise<Author> {
    if (!query.id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const authorId = AuthorId.create(query.id);
    const author = await this.authorRepository.findById(authorId);

    if (!author) {
      throw new NotFoundDomainException(ErrorMessages.AUTHOR_NOT_FOUND);
    }

    return author;
  }
}
