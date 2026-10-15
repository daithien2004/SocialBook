import { ForbiddenError } from '@casl/ability';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { IMediaPort } from '@/modules/media/domain/public-api';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { AuthorRepository } from '@/modules/authors/domain/repositories/author.repository';
import { Author } from '@/modules/authors/domain/entities/author.entity';
import { AuthorId } from '@/modules/authors/domain/value-objects/author-id.vo';
import { AuthorName } from '@/modules/authors/domain/value-objects/author-name.vo';
import { AuthorErrorMessages } from '../../error-messages';
import { CreateAuthorCommand } from './create-author.command';

@CommandHandler(CreateAuthorCommand)
export class CreateAuthorHandler implements ICommandHandler<CreateAuthorCommand> {
  constructor(
    private readonly authorRepository: AuthorRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly media: IMediaPort,
  ) {}

  async execute(command: CreateAuthorCommand): Promise<string> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Author',
    );
    const name = AuthorName.create(command.name);
    if (await this.authorRepository.existsByName(name)) {
      throw new ConflictDomainException(AuthorErrorMessages.AUTHOR_EXISTS);
    }

    // Upload is an external effect, so keep it outside the database transaction.
    const photoUrl = command.photo
      ? await this.media.uploadImage(command.photo)
      : command.photoUrl;
    return this.persist(command, photoUrl);
  }

  @Transactional()
  private async persist(
    command: CreateAuthorCommand,
    photoUrl?: string,
  ): Promise<string> {
    const author = Author.create({
      id: AuthorId.create(this.idGenerator.generate()),
      name: command.name,
      bio: command.bio,
      photoUrl,
    });
    await this.authorRepository.save(author);
    return author.id.toString();
  }
}
