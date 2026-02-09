import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification } from '@/domain/notifications/entities/notification.entity';
import { CreateNotificationCommand } from './create-notification.command';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) { }

  async execute(command: CreateNotificationCommand): Promise<Notification> {
    const notification = Notification.create(
      command.userId,
      command.title,
      command.message,
      command.type,
      command.meta,
      command.actionUrl
    );
    return this.notificationRepository.save(notification);
  }
}
