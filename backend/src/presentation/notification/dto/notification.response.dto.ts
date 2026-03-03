import { ApiProperty } from '@nestjs/swagger';
import { Notification, NotificationMeta } from '@/domain/notifications/entities/notification.entity';

export class NotificationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    message: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    isRead: boolean;

    @ApiProperty({ required: false })
    actionUrl: string | null;

    @ApiProperty({ type: Object, required: false })
    meta?: {
        actorId: string;
        username?: string;
        image?: string;
        targetId?: string;
    };

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
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
