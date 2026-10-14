import type { AppAbility } from '@/shared/casl/app-ability';
import type { CurrentUserReadModel } from '../read-models/current-user.read-model';

export abstract class CurrentUserReadRepository {
  abstract findCurrentUser(
    ability: AppAbility,
    userId: string,
  ): Promise<CurrentUserReadModel | null>;
}
