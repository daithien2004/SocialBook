import { Query } from '@nestjs/cqrs';

import type { Actor } from '@/shared/casl/actor';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { NotificationResult } from '@/modules/notifications/application/notification.result';
export class GetUserNotificationsQuery extends Query<
  PageResult<NotificationResult>
> {
  constructor(
    public readonly actor: Actor,
    public readonly page: number,
    public readonly limit: number,
    public readonly isRead?: boolean,
  ) {
    super();
  }
}
