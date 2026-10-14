import { ForbiddenError } from '@casl/ability';
import { QueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { GenreErrorMessages } from '../../error-messages';
import { GenreReadRepository } from '../../ports/genre-read.repository';
import { GetGenreByIdQuery } from './get-genre-by-id.query';

@QueryHandler(GetGenreByIdQuery)
export class GetGenreByIdHandler {
  constructor(private readonly genreReadRepository: GenreReadRepository) {}

  async execute(query: GetGenreByIdQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan('read', 'Genre');
    const genre = await this.genreReadRepository.findById(
      query.actor.ability,
      query.id,
    );
    if (!genre) {
      throw new NotFoundDomainException(GenreErrorMessages.GENRE_NOT_FOUND);
    }
    return genre;
  }
}
