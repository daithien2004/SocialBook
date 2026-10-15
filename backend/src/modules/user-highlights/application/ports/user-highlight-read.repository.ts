import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { UserHighlightReadModel } from '../user-highlight.read-model';

export interface UserHighlightFilter {
  bookId?: string;
  chapterId?: string;
}

export abstract class UserHighlightReadRepository {
  abstract findPageForUser(
    ability: AppAbility,
    userId: string,
    filter: UserHighlightFilter,
    limit: number,
    offset: number,
  ): Promise<PageResult<UserHighlightReadModel>>;

  abstract findAccessibleById(
    ability: AppAbility,
    id: string,
  ): Promise<UserHighlightReadModel | null>;
}
