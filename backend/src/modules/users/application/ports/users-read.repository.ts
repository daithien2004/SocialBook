import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { AdminUserReadModel } from '../read-models/admin-user.read-model';
import type { PublicUserReadModel } from '../read-models/public-user.read-model';
import type { ReadingPreferencesReadModel } from '../read-models/reading-preferences.read-model';

export interface AdminUserFilter {
  username?: string;
  email?: string;
  roleId?: string;
  isBanned?: boolean;
  isVerified?: boolean;
}

export abstract class UsersReadRepository {
  abstract findAdminUsers(
    ability: AppAbility,
    filter: AdminUserFilter,
    page: PageParams,
  ): Promise<PageResult<AdminUserReadModel>>;

  abstract findPublicUsers(
    username: string | undefined,
    page: PageParams,
  ): Promise<PageResult<PublicUserReadModel>>;

  abstract findReadingPreferences(
    ability: AppAbility,
    userId: string,
  ): Promise<ReadingPreferencesReadModel | null>;
}
