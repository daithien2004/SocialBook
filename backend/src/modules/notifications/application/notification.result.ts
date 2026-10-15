import type { Notification } from '@/modules/notifications/domain/entities/notification.entity';

export interface NotificationResult {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  meta?: {
    actorId?: string;
    username?: string;
    image?: string;
    targetId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationResultMapper {
  static fromDomain(notification: Notification): NotificationResult {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl ?? null,
      meta: notification.meta,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  static fromDomainArray(
    notifications: readonly Notification[],
  ): NotificationResult[] {
    return notifications.map((notification) => this.fromDomain(notification));
  }
}
