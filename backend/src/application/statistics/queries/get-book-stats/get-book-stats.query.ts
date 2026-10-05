import { Query } from '@nestjs/cqrs';
import { BookStats } from '@/domain/statistics/read-models/statistics.model';

export class GetBookStatsQuery extends Query<BookStats> {
  constructor() {
    super();
  }
}
