import { Query } from '@nestjs/cqrs';

import { CollectionStats } from '@/modules/chroma/domain/repositories/vector.repository.interface';

export class GetCollectionStatsQuery extends Query<CollectionStats> {
  constructor() {
    super();
  }
}
