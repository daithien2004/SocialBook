import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { CollectionReadModel } from '@/modules/library/application/read-models/collection.read-model';

export abstract class CollectionReadRepository {
  abstract findPage(
    ability: AppAbility,
    userId: string | undefined,
    page: PageParams,
  ): Promise<PageResult<CollectionReadModel>>;
}
