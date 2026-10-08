import { Query } from '@nestjs/cqrs';
import { UserStats } from '@/modules/statistics/domain/read-models/statistics.model';

export class GetUserStatsQuery extends Query<UserStats> {
  constructor() {
    super();
  }
}
