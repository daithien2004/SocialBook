import { Query } from '@nestjs/cqrs';
import { BookStats } from '@/modules/statistics/domain/read-models/statistics.model';

export class GetBookStatsQuery extends Query<BookStats> {
  constructor() {
    super();
  }
}
