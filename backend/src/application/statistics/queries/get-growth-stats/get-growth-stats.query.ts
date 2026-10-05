import { Query } from '@nestjs/cqrs';
import { GrowthMetric } from '@/domain/statistics/read-models/statistics.model';

export class GetGrowthStatsQuery extends Query<GrowthMetric[]> {
  constructor() {
    super();
  }
}
