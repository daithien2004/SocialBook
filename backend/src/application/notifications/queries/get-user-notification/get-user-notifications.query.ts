import { Query } from '@nestjs/cqrs';

import { Notification } from '@/domain/notifications/entities/notification.entity';
export class GetUserNotificationsQuery extends Query<Notification[]> {
  constructor(
    public readonly userId: string,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly isRead?: boolean,
  ) { super(); }
}
