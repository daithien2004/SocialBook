import { Query } from '@nestjs/cqrs';

export class GetEngagementStatsQuery extends Query<unknown> {
  constructor() { super(); }
}
