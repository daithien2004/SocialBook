import { Query } from '@nestjs/cqrs';

import { CollectionStats } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import type { Actor } from '@/shared/casl/actor';

export class GetCollectionStatsQuery extends Query<CollectionStats> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
