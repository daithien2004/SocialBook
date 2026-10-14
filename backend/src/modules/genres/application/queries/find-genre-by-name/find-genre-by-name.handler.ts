import { QueryHandler } from '@nestjs/cqrs';
import { GenreReadRepository } from '../../ports/genre-read.repository';
import { FindGenreByNameQuery } from './find-genre-by-name.query';

@QueryHandler(FindGenreByNameQuery)
export class FindGenreByNameHandler {
  constructor(private readonly genreReadRepository: GenreReadRepository) {}

  execute(query: FindGenreByNameQuery) {
    return this.genreReadRepository.findByName(query.actor.ability, query.name);
  }
}
