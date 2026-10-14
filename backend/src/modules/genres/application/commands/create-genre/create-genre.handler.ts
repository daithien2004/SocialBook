import { ForbiddenError } from '@casl/ability';
import { CommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { Genre } from '@/modules/genres/domain/entities/genre.entity';
import { GenreId } from '@/modules/genres/domain/value-objects/genre-id.vo';
import { GenreName } from '@/modules/genres/domain/value-objects/genre-name.vo';
import { GenreErrorMessages } from '../../error-messages';
import { GenreResultMapper } from '../../mappers/genre-result.mapper';
import { CreateGenreCommand } from './create-genre.command';

@CommandHandler(CreateGenreCommand)
export class CreateGenreHandler {
  constructor(
    private readonly genreRepository: IGenreRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  @Transactional()
  async execute(command: CreateGenreCommand) {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Genre',
    );
    const name = GenreName.create(command.name);
    if (await this.genreRepository.existsByName(name)) {
      throw new ConflictDomainException(GenreErrorMessages.GENRE_EXISTS);
    }

    const genre = Genre.create({
      id: GenreId.create(this.idGenerator.generate()),
      name: command.name,
      description: command.description,
    });
    await this.genreRepository.save(genre);
    return GenreResultMapper.toReadModel(genre);
  }
}
