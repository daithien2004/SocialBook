import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GenreReadRepository } from '../../ports/genre-read.repository';
import { GetGenresQuery } from './get-genres.query';

@QueryHandler(GetGenresQuery)
export class GetGenresHandler implements IQueryHandler<GetGenresQuery> {
  constructor(private readonly genreReadRepository: GenreReadRepository) {}

  execute(query: GetGenresQuery) {
    return this.genreReadRepository.findPage(
      query.actor.ability,
      query.filter,
      query.pagination,
    );
  }
}
