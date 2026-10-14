import { AppAbility } from '@/shared/casl/app-ability';
import { Page, PageQuery } from '@/shared/domain/page';
import { __Name__ReadModel } from '../read-models/__kebab__.read-model';

export interface List__Names__Filter {
  search?: string;
}

// Port đọc: nhận ability để repository gộp điều kiện quyền vào where.
export abstract class __Name__QueryRepository {
  abstract findAccessible(
    ability: AppAbility,
    filter: List__Names__Filter,
    page: PageQuery,
  ): Promise<Page<__Name__ReadModel>>;

  abstract findAccessibleById(ability: AppAbility, id: string): Promise<__Name__ReadModel | null>;
}
