import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { AuthorReadModel } from '../../read-models/author.read-model';

export class FindAuthorByNameQuery extends Query<AuthorReadModel | null> {
  constructor(
    readonly actor: Actor,
    readonly name: string,
  ) {
    super();
  }
}
