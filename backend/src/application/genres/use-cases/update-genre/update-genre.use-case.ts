import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { Genre } from '@/domain/genres/entities/genre.entity';
import { GenreId } from '@/domain/genres/value-objects/genre-id.vo';
import { GenreName } from '@/domain/genres/value-objects/genre-name.vo';
import { UpdateGenreCommand } from './update-genre.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class UpdateGenreUseCase {
    constructor(
        private readonly genreRepository: IGenreRepository
    ) {}

    async execute(command: UpdateGenreCommand): Promise<Genre> {
        const genreId = GenreId.create(command.id);
        const genre = await this.genreRepository.findById(genreId);
        
        if (!genre) {
            throw new NotFoundException(ErrorMessages.GENRE_NOT_FOUND || 'Genre not found');
        }

        if (command.name && command.name !== genre.name.toString()) {
            const newName = GenreName.create(command.name);
            const exists = await this.genreRepository.existsByName(newName, genreId);
            
            if (exists) {
                throw new ConflictException(ErrorMessages.GENRE_EXISTS || 'Genre name already exists');
            }
            
            genre.changeName(command.name);
        }

        if (command.description !== undefined) {
            genre.updateDescription(command.description);
        }
        await this.genreRepository.save(genre);

        return genre;
    }
}


