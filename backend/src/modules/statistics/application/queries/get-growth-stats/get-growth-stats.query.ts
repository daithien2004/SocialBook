import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GrowthMetricReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export type GrowthGroupBy = 'day' | 'month' | 'year';

export class GetGrowthStatsQuery extends Query<GrowthMetricReadModel[]> {
  constructor(
    public readonly actor: Actor,
    public readonly days: number,
    public readonly groupBy: GrowthGroupBy,
  ) {
    super();
  }
}
