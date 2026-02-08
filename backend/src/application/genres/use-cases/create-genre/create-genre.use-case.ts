import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { Genre } from '@/domain/genres/entities/genre.entity';
import { GenreName } from '@/domain/genres/value-objects/genre-name.vo';
import { CreateGenreCommand } from './create-genre.command';
import { ErrorMessages } from '@/common/constants/error-messages';

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


