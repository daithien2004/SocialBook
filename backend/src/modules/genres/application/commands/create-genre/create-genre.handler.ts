import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Genre } from '@/modules/genres/domain/entities/genre.entity';
import { GenreId } from '@/modules/genres/domain/value-objects/genre-id.vo';
import { GenreName } from '@/modules/genres/domain/value-objects/genre-name.vo';
import { CreateGenreCommand } from './create-genre.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@CommandHandler(CreateGenreCommand)
export class CreateGenreHandler implements ICommandHandler<
  CreateGenreCommand,
  Genre
> {
  constructor(
    private readonly genreRepository: IGenreRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: CreateGenreCommand): Promise<Genre> {
    const name = GenreName.create(command.name);
    const exists = await this.genreRepository.existsByName(name);

    if (exists) {
      throw new ConflictDomainException(
        ErrorMessages.GENRE_EXISTS || 'Genre already exists',
      );
    }

    const genre = Genre.create({
      id: GenreId.create(this.idGenerator.generate()),
      name: command.name,
      description: command.description,
    });

    await this.genreRepository.save(genre);

    return genre;
  }
}
