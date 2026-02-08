import { Injectable, NotFoundException } from '@nestjs/common';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { Genre } from '@/domain/genres/entities/genre.entity';
import { GenreId } from '@/domain/genres/value-objects/genre-id.vo';
import { ErrorMessages } from '@/common/constants/error-messages';

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


