import { Query } from '@nestjs/cqrs';
import { OverviewStats } from '@/modules/statistics/domain/read-models/statistics.model';

export class GetOverviewStatsQuery extends Query<OverviewStats> {
  constructor() {
    super();
  }
}
