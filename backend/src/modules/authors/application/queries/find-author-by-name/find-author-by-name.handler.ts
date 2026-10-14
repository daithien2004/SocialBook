import { QueryHandler } from '@nestjs/cqrs';
import { AuthorReadRepository } from '../../ports/author-read.repository';
import { FindAuthorByNameQuery } from './find-author-by-name.query';

@QueryHandler(FindAuthorByNameQuery)
export class FindAuthorByNameHandler {
  constructor(private readonly authorReadRepository: AuthorReadRepository) {}

  execute(query: FindAuthorByNameQuery) {
    return this.authorReadRepository.findByName(
      query.actor.ability,
      query.name,
    );
  }
}
