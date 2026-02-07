import { Notification } from '../entities/notification.entity';

export abstract class INotificationRepository {
  abstract save(notification: Notification): Promise<Notification>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract findAllByUser(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  abstract markAsRead(userId: string, notificationId: string): Promise<void>;
  abstract countUnread(userId: string): Promise<number>;
}
