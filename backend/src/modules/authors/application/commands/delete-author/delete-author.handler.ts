import { ForbiddenError, subject } from '@casl/ability';
import { CommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { AuthorRepository } from '@/modules/authors/domain/repositories/author.repository';
import { AuthorId } from '@/modules/authors/domain/value-objects/author-id.vo';
import { AuthorErrorMessages } from '../../error-messages';
import { DeleteAuthorCommand } from './delete-author.command';

@CommandHandler(DeleteAuthorCommand)
export class DeleteAuthorHandler {
  constructor(private readonly authorRepository: AuthorRepository) {}

  @Transactional()
  async execute(command: DeleteAuthorCommand): Promise<void> {
    const id = AuthorId.create(command.id);
    const author = await this.authorRepository.findById(id);
    if (!author) {
      throw new NotFoundDomainException(AuthorErrorMessages.AUTHOR_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'delete',
      subject('Author', { id: author.id.toString() }),
    );
    await this.authorRepository.delete(id);
  }
}
