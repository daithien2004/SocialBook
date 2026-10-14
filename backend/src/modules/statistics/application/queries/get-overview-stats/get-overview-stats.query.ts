import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { OverviewStatsReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class GetOverviewStatsQuery extends Query<OverviewStatsReadModel> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
