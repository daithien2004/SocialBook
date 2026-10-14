import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { UserLocationSummaryReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class CheckUserLocationsQuery extends Query<UserLocationSummaryReadModel> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
