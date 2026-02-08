import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification } from '@/domain/notifications/entities/notification.entity';

@Injectable()
export class GetUserNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    return this.notificationRepository.findAllByUser(userId, limit, offset);
  }
}

