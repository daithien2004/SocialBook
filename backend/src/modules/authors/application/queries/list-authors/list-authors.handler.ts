import { QueryHandler } from '@nestjs/cqrs';
import { AuthorReadRepository } from '../../ports/author-read.repository';
import { ListAuthorsQuery } from './list-authors.query';

@QueryHandler(ListAuthorsQuery)
export class ListAuthorsHandler {
  constructor(private readonly authorReadRepository: AuthorReadRepository) {}

  execute(query: ListAuthorsQuery) {
    return this.authorReadRepository.findPage(
      query.actor.ability,
      query.filter,
      query.pagination,
    );
  }
}
