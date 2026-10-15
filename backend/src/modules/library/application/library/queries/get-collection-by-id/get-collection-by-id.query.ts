import { Query } from '@nestjs/cqrs';

import { GetCollectionByIdResult } from '@/modules/library/application/library/queries/get-collection-by-id/get-collection-by-id.handler';
import type { Actor } from '@/shared/casl/actor';

export class GetCollectionByIdQuery extends Query<GetCollectionByIdResult | null> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly collectionId: string,
  ) {
    super();
  }
}
