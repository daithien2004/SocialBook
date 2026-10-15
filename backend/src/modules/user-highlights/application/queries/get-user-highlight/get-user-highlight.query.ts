import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { UserHighlightReadModel } from '../../user-highlight.read-model';

export class GetUserHighlightQuery extends Query<UserHighlightReadModel | null> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
  ) {
    super();
  }
}
