export interface NotificationMeta {
  actorId?: string;
  username?: string;
  image?: string;
  targetId?: string;
}

export class CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead?: boolean;
  actionUrl?: string;
  meta?: NotificationMeta;

  constructor(
    userId: string,
    title: string,
    message: string,
    type: string,
    meta?: NotificationMeta,
    actionUrl?: string,
    isRead?: boolean,
  ) {
    this.userId = userId;
    this.title = title;
    this.message = message;
    this.type = type;
    this.meta = meta;
    this.actionUrl = actionUrl;
    this.isRead = isRead;
  }
}
