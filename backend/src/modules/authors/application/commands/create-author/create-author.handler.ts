import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { IAuthorRepository } from '@/modules/authors/domain/repositories/author.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Author } from '@/modules/authors/domain/entities/author.entity';
import { AuthorId } from '@/modules/authors/domain/value-objects/author-id.vo';
import { AuthorName } from '@/modules/authors/domain/value-objects/author-name.vo';
import { CreateAuthorCommand } from './create-author.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@CommandHandler(CreateAuthorCommand)
export class CreateAuthorHandler implements ICommandHandler<
  CreateAuthorCommand,
  Author
> {
  constructor(
    private readonly authorRepository: IAuthorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: CreateAuthorCommand): Promise<Author> {
    const name = AuthorName.create(command.name);
    const exists = await this.authorRepository.existsByName(name);

    if (exists) {
      throw new ConflictDomainException(
        ErrorMessages.AUTHOR_EXISTS || 'Author already exists',
      );
    }

    const author = Author.create({
      id: AuthorId.create(this.idGenerator.generate()),
      name: command.name,
      bio: command.bio,
      photoUrl: command.photoUrl,
    });

    await this.authorRepository.save(author);

    return author;
  }
}
