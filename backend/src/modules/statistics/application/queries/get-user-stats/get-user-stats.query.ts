import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { UserStatsReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class GetUserStatsQuery extends Query<UserStatsReadModel> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
