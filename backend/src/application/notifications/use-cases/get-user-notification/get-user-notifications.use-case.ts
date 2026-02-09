import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification } from '@/domain/notifications/entities/notification.entity';
import { GetUserNotificationsQuery } from './get-user-notifications.query';

@Injectable()
export class GetUserNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) { }

  async execute(query: GetUserNotificationsQuery): Promise<Notification[]> {
    const offset = (query.page - 1) * query.limit;
    return this.notificationRepository.findAllByUser(
      query.userId,
      query.limit,
      offset,
      query.isRead
    );
  }
}
