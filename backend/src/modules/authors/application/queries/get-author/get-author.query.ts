import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { AuthorReadModel } from '../../read-models/author.read-model';

export class GetAuthorQuery extends Query<AuthorReadModel> {
  constructor(
    readonly actor: Actor,
    readonly id: string,
  ) {
    super();
  }
}
