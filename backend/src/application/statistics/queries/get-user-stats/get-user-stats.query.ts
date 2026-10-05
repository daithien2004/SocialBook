import { Query } from '@nestjs/cqrs';
import { UserStats } from '@/domain/statistics/read-models/statistics.model';

export class GetUserStatsQuery extends Query<UserStats> {
  constructor() {
    super();
  }
}
