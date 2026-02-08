import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification, NotificationType, NotificationMeta } from '@/domain/notifications/entities/notification.entity';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    userId: string,
    title: string,
    message: string,
    type: NotificationType | string,
    meta?: NotificationMeta,
    actionUrl?: string,
  ): Promise<Notification> {
    const notification = Notification.create(userId, title, message, type, meta, actionUrl);
    return this.notificationRepository.save(notification);
  }
}

