import { Command } from '@nestjs/cqrs';
import { Notification } from '@/domain/notifications/entities/notification.entity';

export class CreateNotificationCommand extends Command<Notification> {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly type: string,
    public readonly meta?: Record<string, any>,
    public readonly actionUrl?: string,
  ) {
    super();
  }
}
