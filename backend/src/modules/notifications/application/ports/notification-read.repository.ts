import type { AppAbility } from '@/shared/casl/app-ability';
import type { NotificationResult } from '../notification.result';

export abstract class NotificationReadRepository {
  abstract findPageByUser(
    ability: AppAbility,
    userId: string,
    limit: number,
    offset: number,
    isRead?: boolean,
  ): Promise<{ items: NotificationResult[]; total: number }>;

  abstract findAccessibleById(
    ability: AppAbility,
    id: string,
  ): Promise<NotificationResult | null>;
}
