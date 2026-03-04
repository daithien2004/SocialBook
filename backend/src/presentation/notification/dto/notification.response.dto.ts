import { Notification } from '@/domain/notifications/entities/notification.entity';

export class NotificationResponseDto {
    id: string;

    title: string;

    message: string;

    type: string;

    isRead: boolean;

    actionUrl: string | null;

    meta?: {
        actorId: string;
        username?: string;
        image?: string;
        targetId?: string;
    };

    createdAt: Date;

    updatedAt: Date;


    constructor(notification: Notification) {
        this.id = notification.id.toString();
        this.title = notification.title;
        this.message = notification.message;
        this.type = notification.type;
        this.isRead = notification.isRead || false;
        this.actionUrl = notification.actionUrl || null;
        this.createdAt = notification.createdAt || new Date();
        this.updatedAt = notification.updatedAt || new Date();

        if (notification.meta) {
            this.meta = {
                actorId: notification.meta.actorId || '',
                username: notification.meta.username,
                image: notification.meta.avatar,
                targetId: notification.meta.targetId,
            };
        }
    }

    static fromDomain(notification: Notification): NotificationResponseDto {
        return new NotificationResponseDto(notification);
    }

    static fromArray(notifications: Notification[]): NotificationResponseDto[] {
        return notifications.map(n => new NotificationResponseDto(n));
    }
}
