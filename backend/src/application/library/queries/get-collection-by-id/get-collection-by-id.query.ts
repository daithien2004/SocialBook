import { Query } from '@nestjs/cqrs';

import { GetCollectionByIdResult } from '@/application/library/queries/get-collection-by-id/get-collection-by-id.handler';

export class GetCollectionByIdQuery extends Query<GetCollectionByIdResult | null> {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
  ) {
    super();
  }
}
