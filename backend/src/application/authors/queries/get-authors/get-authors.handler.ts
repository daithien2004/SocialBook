import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PaginationOptions } from '@/common/interfaces/pagination.interface';
import {
  AuthorFilter,
  IAuthorRepository,
} from '@/domain/authors/repositories/author.repository.interface';
import { GetAuthorsQuery } from './get-authors.query';

import { PaginatedResult } from '@/shared/domain/pagination.types';
import { Author } from '@/domain/authors/entities/author.entity';

@QueryHandler(GetAuthorsQuery)
export class GetAuthorsHandler implements IQueryHandler<
  GetAuthorsQuery,
  PaginatedResult<Author>
> {
  constructor(private readonly authorRepository: IAuthorRepository) {}

  async execute(query: GetAuthorsQuery) {
    const filter: AuthorFilter = {
      name: query.name,
      bio: query.bio,
    };

    const pagination: PaginationOptions = {
      page: query.page,
      limit: query.limit,
    };

    return await this.authorRepository.findAll(filter, pagination);
  }
}
