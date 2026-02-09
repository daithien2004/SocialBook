import { NotificationType, NotificationMeta } from '@/domain/notifications/entities/notification.entity';

export class CreateNotificationCommand {
    constructor(
        public readonly userId: string,
        public readonly title: string,
        public readonly message: string,
        public readonly type: NotificationType | string,
        public readonly meta?: NotificationMeta,
        public readonly actionUrl?: string,
    ) { }
}
