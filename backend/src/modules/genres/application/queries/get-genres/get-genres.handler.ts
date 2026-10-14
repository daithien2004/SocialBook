import { ForbiddenError } from '@casl/ability';
import { QueryHandler } from '@nestjs/cqrs';
import { GenreReadRepository } from '../../ports/genre-read.repository';
import { GetGenresQuery } from './get-genres.query';

@QueryHandler(GetGenresQuery)
export class GetGenresHandler {
  constructor(private readonly genreReadRepository: GenreReadRepository) {}

  execute(query: GetGenresQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan('read', 'Genre');
    return this.genreReadRepository.findPage(
      query.actor.ability,
      query.filter,
      query.pagination,
    );
  }
}
