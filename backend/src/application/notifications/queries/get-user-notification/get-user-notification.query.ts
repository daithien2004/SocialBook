import { Query } from '@nestjs/cqrs';
import { Notification } from '@/domain/notifications/entities/notification.entity';

export class GetUserNotificationsQuery extends Query<Notification[]> {
  constructor() {
    super();
  }
}
