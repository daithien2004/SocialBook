import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ReadingHeatmapReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class GetReadingHeatmapQuery extends Query<ReadingHeatmapReadModel[]> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
