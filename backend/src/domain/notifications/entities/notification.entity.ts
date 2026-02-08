import { Types } from 'mongoose';

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

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly type: NotificationType | string,
    public isRead: boolean,
    public readonly sentAt: Date,
    public readonly actionUrl?: string,
    public readonly meta?: NotificationMeta,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public markAsRead(): void {
    this.isRead = true;
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
      new Types.ObjectId().toString(),
      userId,
      title,
      message,
      type,
      false,
      new Date(),
      actionUrl,
      meta,
      new Date(),
      new Date(),
    );
  }
}
