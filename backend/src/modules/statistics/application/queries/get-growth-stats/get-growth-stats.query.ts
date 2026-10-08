import { Query } from '@nestjs/cqrs';
import { GrowthMetric } from '@/modules/statistics/domain/read-models/statistics.model';

export class GetGrowthStatsQuery extends Query<GrowthMetric[]> {
  constructor() {
    super();
  }
}
