import { CommandHandler } from '@nestjs/cqrs';
import { MarkAllNotificationsReadCommand } from './mark-all-notifications-read.command';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';

@CommandHandler(MarkAllNotificationsReadCommand)
export class MarkAllNotificationsReadHandler {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: MarkAllNotificationsReadCommand): Promise<void> {
    await this.notificationRepository.markAllAsRead((command as any).userId);
  }
}
