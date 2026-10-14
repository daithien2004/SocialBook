import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ActiveUsersReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class GetActiveUsersQuery extends Query<ActiveUsersReadModel> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
