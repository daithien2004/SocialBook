import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GeographicReadModel } from '@/modules/statistics/application/read-models/statistics.read-model';

export class GetGeographicDistributionQuery extends Query<
  GeographicReadModel[]
> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
