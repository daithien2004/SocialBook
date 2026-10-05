import { Query } from '@nestjs/cqrs';

import { GetAllCollectionsResult } from '@/application/library/queries/get-all-collections/get-all-collections.handler';

export class GetAllCollectionsQuery extends Query<GetAllCollectionsResult[]> {
  constructor(
    public readonly userId: string,
    public readonly viewerId?: string,
  ) {
    super();
  }
}
