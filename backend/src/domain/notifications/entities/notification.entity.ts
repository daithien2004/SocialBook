import { Entity } from '@/shared/domain/entity.base';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system',
  MESSAGE = 'message',
  COMMENT = 'comment',
  REPLY = 'reply',
  LIKE = 'like',
  FOLLOW = 'follow',
}

export interface NotificationMeta {
  actorId?: string;
  username?: string;
  avatar?: string;
  targetId?: string;
  [key: string]: any;
}

export interface NotificationProps {
    userId: string;
    title: string;
    message: string;
    type: NotificationType | string;
    isRead: boolean;
    sentAt: Date;
    actionUrl?: string;
    meta?: NotificationMeta;
}

export class Notification extends Entity<string> {
    private _props: NotificationProps;

    private constructor(id: string, props: NotificationProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    get title(): string { return this._props.title; }
    get message(): string { return this._props.message; }
    get type(): NotificationType | string { return this._props.type; }
    get isRead(): boolean { return this._props.isRead; }
    get sentAt(): Date { return this._props.sentAt; }
    get actionUrl(): string | undefined { return this._props.actionUrl; }
    get meta(): NotificationMeta | undefined { return this._props.meta; }
    get userId(): string { return this._props.userId; }

    public markAsRead(): void {
        this._props.isRead = true;
        this.markAsUpdated();
    }

    public static create(
        id: string,
        userId: string,
        title: string,
        message: string,
        type: NotificationType | string,
        meta?: NotificationMeta,
        actionUrl?: string,
    ): Notification {
        return new Notification(
            id,
            {
                userId,
                title,
                message,
                type,
                isRead: false,
                sentAt: new Date(),
                actionUrl,
                meta
            }
        );
    }

    public static reconstitute(props: {
        id: string;
        userId: string;
        title: string;
        message: string;
        type: NotificationType | string;
        isRead: boolean;
        sentAt: Date;
        actionUrl?: string;
        meta?: NotificationMeta;
        createdAt: Date;
        updatedAt: Date;
    }): Notification {
        return new Notification(
            props.id,
            {
                userId: props.userId,
                title: props.title,
                message: props.message,
                type: props.type,
                isRead: props.isRead,
                sentAt: props.sentAt,
                actionUrl: props.actionUrl,
                meta: props.meta
            },
            props.createdAt,
            props.updatedAt
        );
    }
}
