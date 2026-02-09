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

export class Notification extends Entity<string> {
    private constructor(
        id: string,
        public readonly userId: string,
        private _title: string,
        private _message: string,
        private _type: NotificationType | string,
        private _isRead: boolean,
        private _sentAt: Date,
        private _actionUrl?: string,
        private _meta?: NotificationMeta,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        super(id, createdAt, updatedAt);
    }

    get title(): string { return this._title; }
    get message(): string { return this._message; }
    get type(): NotificationType | string { return this._type; }
    get isRead(): boolean { return this._isRead; }
    get sentAt(): Date { return this._sentAt; }
    get actionUrl(): string | undefined { return this._actionUrl; }
    get meta(): NotificationMeta | undefined { return this._meta; }

    public markAsRead(): void {
        this._isRead = true;
        this.markAsUpdated();
    }

    public static create(
        userId: string,
        title: string,
        message: string,
        type: NotificationType | string,
        meta?: NotificationMeta,
        actionUrl?: string,
    ): Notification {
        return new Notification(
            crypto.randomUUID(),
            userId,
            title,
            message,
            type,
            false,
            new Date(),
            actionUrl,
            meta
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
            props.userId,
            props.title,
            props.message,
            props.type,
            props.isRead,
            props.sentAt,
            props.actionUrl,
            props.meta,
            props.createdAt,
            props.updatedAt
        );
    }
}
