import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { CollectionReadModel } from '@/modules/library/application/read-models/collection.read-model';

export class GetAllCollectionsQuery extends Query<
  PageResult<CollectionReadModel>
> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string | undefined,
    public readonly page: PageParams,
  ) {
    super();
  }
}
