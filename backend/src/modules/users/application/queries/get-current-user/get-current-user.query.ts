import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { CurrentUserReadModel } from '../../read-models/current-user.read-model';

export class GetCurrentUserQuery extends Query<CurrentUserReadModel> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
