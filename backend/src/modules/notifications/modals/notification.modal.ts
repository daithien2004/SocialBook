import { NotificationDocument } from '../schemas/notification.schema';

const toIdString = (id: any): string => {
    if (!id) return '';
    return typeof id === 'string' ? id : id.toString();
};

export class NotificationModal {
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

    constructor(notification: NotificationDocument | any) {
        this.id = toIdString(notification.id || notification._id);
        this.title = notification.title;
        this.message = notification.message;
        this.type = notification.type;
        this.isRead = notification.isRead || false;
        this.actionUrl = notification.actionUrl;
        this.createdAt = notification.createdAt;
        this.updatedAt = notification.updatedAt;

        if (notification.meta) {
            this.meta = {
                actorId: toIdString(notification.meta.actorId),
                username: notification.meta.username,
                image: notification.meta.image,
                targetId: notification.meta.targetId ? toIdString(notification.meta.targetId) : undefined,
            };
        }
    }

    static fromArray(notifications: (NotificationDocument | any)[]): NotificationModal[] {
        return notifications.map(n => new NotificationModal(n));
    }
}
