import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { AuthorReadModel } from '../../read-models/author.read-model';

export class ListAuthorsQuery extends Query<PageResult<AuthorReadModel>> {
  constructor(
    readonly actor: Actor,
    readonly filter: { name?: string; bio?: string },
    readonly pagination: PageParams,
  ) {
    super();
  }
}
