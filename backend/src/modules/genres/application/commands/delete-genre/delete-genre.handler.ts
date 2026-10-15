import { ForbiddenError, subject } from '@casl/ability';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { GenreId } from '@/modules/genres/domain/value-objects/genre-id.vo';
import { GenreErrorMessages } from '../../error-messages';
import { GenreReadRepository } from '../../ports/genre-read.repository';
import { DeleteGenreCommand } from './delete-genre.command';

@CommandHandler(DeleteGenreCommand)
export class DeleteGenreHandler implements ICommandHandler<DeleteGenreCommand> {
  constructor(
    private readonly genreRepository: IGenreRepository,
    private readonly genreReadRepository: GenreReadRepository,
  ) {}

  @Transactional()
  async execute(command: DeleteGenreCommand): Promise<void> {
    const genreId = GenreId.create(command.id);
    const genre = await this.genreRepository.findById(genreId);
    if (!genre) {
      throw new NotFoundDomainException(GenreErrorMessages.GENRE_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'delete',
      subject('Genre', { id: genre.id.toString() }),
    );

    const booksCount = await this.genreReadRepository.countActiveBooksByGenre(
      genreId.toString(),
    );
    if (booksCount > 0) {
      throw new ConflictDomainException(
        `Cannot delete genre while ${booksCount.toString()} active books use it`,
      );
    }
    await this.genreRepository.delete(genreId);
  }
}
