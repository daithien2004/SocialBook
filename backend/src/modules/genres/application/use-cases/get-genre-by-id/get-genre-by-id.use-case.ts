import { Injectable, NotFoundException } from '@nestjs/common';
import { IGenreRepository } from '../../../domain/repositories/genre.repository.interface';
import { Genre } from '../../../domain/entities/genre.entity';
import { GenreId } from '../../../domain/value-objects/genre-id.vo';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class GetGenreByIdUseCase {
    constructor(
        private readonly genreRepository: IGenreRepository
    ) {}

    async execute(id: string): Promise<Genre> {
        const genreId = GenreId.create(id);
        const genre = await this.genreRepository.findById(genreId);
        
        if (!genre) {
            throw new NotFoundException(ErrorMessages.GENRE_NOT_FOUND || 'Genre not found');
        }

        return genre;
    }
}
