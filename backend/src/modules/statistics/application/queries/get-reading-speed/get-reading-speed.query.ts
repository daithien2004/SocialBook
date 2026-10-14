import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ReadingSpeedReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class GetReadingSpeedQuery extends Query<ReadingSpeedReadModel[]> {
  constructor(
    public readonly actor: Actor,
    public readonly days: number,
  ) {
    super();
  }
}
