import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { NotificationMeta } from '@/modules/notifications/domain/entities/notification.entity';

export class CreateNotificationCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly type: string,
    public readonly meta?: NotificationMeta,
    public readonly actionUrl?: string,
  ) {
    super();
  }
}
