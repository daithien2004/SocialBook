import { Query } from '@nestjs/cqrs';
import { OverviewStats } from '@/domain/statistics/read-models/statistics.model';

export class GetOverviewStatsQuery extends Query<OverviewStats> {
  constructor() {
    super();
  }
}
