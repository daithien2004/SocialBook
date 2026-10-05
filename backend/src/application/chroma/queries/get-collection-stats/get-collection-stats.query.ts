import { Query } from '@nestjs/cqrs';

import { CollectionStats } from '@/domain/chroma/repositories/vector.repository.interface';

export class GetCollectionStatsQuery extends Query<CollectionStats> {
  constructor() {
    super();
  }
}
