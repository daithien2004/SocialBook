import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { Genre } from '@/domain/genres/entities/genre.entity';
import { GenreId } from '@/domain/genres/value-objects/genre-id.vo';
import { ErrorMessages } from '@/common/constants/error-messages';
import { GetGenreByIdQuery } from './get-genre-by-id.query';

@Injectable()
export class GetGenreByIdUseCase {
  constructor(private readonly genreRepository: IGenreRepository) {}

  async execute(query: GetGenreByIdQuery): Promise<Genre> {
    const genreId = GenreId.create(query.id);
    const genre = await this.genreRepository.findById(genreId);

    if (!genre) {
      throw new NotFoundDomainException(
        ErrorMessages.GENRE_NOT_FOUND || 'Genre not found',
      );
    }

    return genre;
  }
}
