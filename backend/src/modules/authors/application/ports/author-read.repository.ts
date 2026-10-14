import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { AuthorReadModel } from '../read-models/author.read-model';
import type { AuthorSearchReadModel } from '../read-models/author-search.read-model';

export abstract class AuthorReadRepository {
  abstract findById(
    ability: AppAbility,
    id: string,
  ): Promise<AuthorReadModel | null>;

  abstract findByName(
    ability: AppAbility,
    name: string,
  ): Promise<AuthorReadModel | null>;

  abstract searchByName(
    name: string,
    limit: number,
  ): Promise<AuthorSearchReadModel[]>;

  abstract findPage(
    ability: AppAbility,
    filter: { name?: string; bio?: string },
    pagination: PageParams,
  ): Promise<PageResult<AuthorReadModel>>;
}
