import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { NotificationResult } from '../../notification.result';

export class GetNotificationByIdQuery extends Query<NotificationResult | null> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
  ) {
    super();
  }
}
