import { ForbiddenError, subject } from '@casl/ability';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { IMediaPort } from '@/modules/media/domain/public-api';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { AuthorRepository } from '@/modules/authors/domain/repositories/author.repository';
import { AuthorId } from '@/modules/authors/domain/value-objects/author-id.vo';
import { AuthorName } from '@/modules/authors/domain/value-objects/author-name.vo';
import { AuthorErrorMessages } from '../../error-messages';
import { UpdateAuthorCommand } from './update-author.command';

@CommandHandler(UpdateAuthorCommand)
export class UpdateAuthorHandler implements ICommandHandler<UpdateAuthorCommand> {
  constructor(
    private readonly authorRepository: AuthorRepository,
    private readonly media: IMediaPort,
  ) {}

  async execute(command: UpdateAuthorCommand): Promise<void> {
    const authorId = AuthorId.create(command.id);
    const author = await this.authorRepository.findById(authorId);
    if (!author) {
      throw new NotFoundDomainException(AuthorErrorMessages.AUTHOR_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('Author', { id: author.id.toString() }),
    );

    const photoUrl = command.photo
      ? await this.media.uploadImage(command.photo)
      : command.photoUrl;
    await this.persist(command, authorId, photoUrl);
  }

  @Transactional()
  private async persist(
    command: UpdateAuthorCommand,
    authorId: AuthorId,
    photoUrl?: string,
  ): Promise<void> {
    const author = await this.authorRepository.findById(authorId);
    if (!author) {
      throw new NotFoundDomainException(AuthorErrorMessages.AUTHOR_NOT_FOUND);
    }
    if (command.name && command.name.trim() !== author.name.toString()) {
      const name = AuthorName.create(command.name);
      if (await this.authorRepository.existsByName(name, authorId)) {
        throw new ConflictDomainException(AuthorErrorMessages.AUTHOR_EXISTS);
      }
      author.changeName(command.name);
    }
    if (command.bio !== undefined) author.updateBio(command.bio);
    if (photoUrl !== undefined) author.updatePhotoUrl(photoUrl);
    await this.authorRepository.save(author);
  }
}
