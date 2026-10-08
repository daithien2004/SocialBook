import { Query } from '@nestjs/cqrs';
export class GetModerationStatsQuery extends Query<{
  total: number;
  toxic: number;
  spoiler: number;
  other: number;
}> {
  constructor() {
    super();
  }
}
