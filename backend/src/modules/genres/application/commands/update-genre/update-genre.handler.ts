import { ForbiddenError, subject } from '@casl/ability';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { GenreId } from '@/modules/genres/domain/value-objects/genre-id.vo';
import { GenreName } from '@/modules/genres/domain/value-objects/genre-name.vo';
import { GenreErrorMessages } from '../../error-messages';
import { GenreResultMapper } from '../../mappers/genre-result.mapper';
import { UpdateGenreCommand } from './update-genre.command';

@CommandHandler(UpdateGenreCommand)
export class UpdateGenreHandler implements ICommandHandler<UpdateGenreCommand> {
  constructor(private readonly genreRepository: IGenreRepository) {}

  @Transactional()
  async execute(command: UpdateGenreCommand) {
    const genreId = GenreId.create(command.id);
    const genre = await this.genreRepository.findById(genreId);
    if (!genre) {
      throw new NotFoundDomainException(GenreErrorMessages.GENRE_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('Genre', { id: genre.id.toString() }),
    );

    if (command.name && command.name !== genre.name.toString()) {
      const name = GenreName.create(command.name);
      if (await this.genreRepository.existsByName(name, genreId)) {
        throw new ConflictDomainException(GenreErrorMessages.GENRE_EXISTS);
      }
      genre.changeName(command.name);
    }
    if (command.description !== undefined) {
      genre.updateDescription(command.description);
    }
    await this.genreRepository.save(genre);
    return GenreResultMapper.toReadModel(genre);
  }
}
