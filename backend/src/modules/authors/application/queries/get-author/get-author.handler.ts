import { QueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { AuthorReadRepository } from '../../ports/author-read.repository';
import type { AuthorReadModel } from '../../read-models/author.read-model';
import { AuthorErrorMessages } from '../../error-messages';
import { GetAuthorQuery } from './get-author.query';

@QueryHandler(GetAuthorQuery)
export class GetAuthorHandler {
  constructor(private readonly authorReadRepository: AuthorReadRepository) {}

  async execute(query: GetAuthorQuery): Promise<AuthorReadModel> {
    const author = await this.authorReadRepository.findById(
      query.actor.ability,
      query.id,
    );
    if (!author) {
      throw new NotFoundDomainException(AuthorErrorMessages.AUTHOR_NOT_FOUND);
    }
    return author;
  }
}
