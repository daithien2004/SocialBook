import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { MarkNotificationReadCommand } from './mark-notification-read.command';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) { }

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    await this.notificationRepository.markAsRead(command.userId, command.notificationId);
  }
}
