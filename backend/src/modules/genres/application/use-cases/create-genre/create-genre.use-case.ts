import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { IGenreRepository } from '../../../domain/repositories/genre.repository.interface';
import { Genre } from '../../../domain/entities/genre.entity';
import { GenreName } from '../../../domain/value-objects/genre-name.vo';
import { CreateGenreCommand } from './create-genre.command';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class CreateGenreUseCase {
    constructor(
        private readonly genreRepository: IGenreRepository
    ) {}

    async execute(command: CreateGenreCommand): Promise<Genre> {
        const name = GenreName.create(command.name);
        const exists = await this.genreRepository.existsByName(name);
        
        if (exists) {
            throw new ConflictException(ErrorMessages.GENRE_EXISTS || 'Genre already exists');
        }

        const genre = Genre.create({
            name: command.name,
            description: command.description
        });

        await this.genreRepository.save(genre);

        return genre;
    }
}
