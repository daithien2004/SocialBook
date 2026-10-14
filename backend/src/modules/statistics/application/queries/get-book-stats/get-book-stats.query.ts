import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { BookStatsReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class GetBookStatsQuery extends Query<BookStatsReadModel> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
