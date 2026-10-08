import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { Genre } from '@/modules/genres/domain/entities/genre.entity';
import { GenreId } from '@/modules/genres/domain/value-objects/genre-id.vo';
import { GenreName } from '@/modules/genres/domain/value-objects/genre-name.vo';
import { UpdateGenreCommand } from './update-genre.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@CommandHandler(UpdateGenreCommand)
export class UpdateGenreHandler implements ICommandHandler<
  UpdateGenreCommand,
  Genre
> {
  constructor(private readonly genreRepository: IGenreRepository) {}

  async execute(command: UpdateGenreCommand): Promise<Genre> {
    const genreId = GenreId.create(command.id);
    const genre = await this.genreRepository.findById(genreId);

    if (!genre) {
      throw new NotFoundDomainException(
        ErrorMessages.GENRE_NOT_FOUND || 'Genre not found',
      );
    }

    if (command.name && command.name !== genre.name.toString()) {
      const newName = GenreName.create(command.name);
      const exists = await this.genreRepository.existsByName(newName, genreId);

      if (exists) {
        throw new ConflictDomainException(
          ErrorMessages.GENRE_EXISTS || 'Genre name already exists',
        );
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
