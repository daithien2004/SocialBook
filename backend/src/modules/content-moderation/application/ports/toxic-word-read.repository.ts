import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { ToxicWordReadModel } from '../read-models/toxic-word.read-model';

export abstract class ToxicWordReadRepository {
  abstract findPage(
    ability: AppAbility,
    search: string | undefined,
    page: PageParams,
  ): Promise<PageResult<ToxicWordReadModel>>;
}
