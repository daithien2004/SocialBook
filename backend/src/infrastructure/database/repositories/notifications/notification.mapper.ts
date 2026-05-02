import {
  Notification,
  NotificationType,
  NotificationMeta,
} from '@/domain/notifications/entities/notification.entity';
import { NotificationDocument } from '@/infrastructure/database/schemas/notification.schema';
import { Types } from 'mongoose';

interface NotificationPersistence {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType | string;
  isRead: boolean;
  sentAt: Date;
  actionUrl?: string;
  meta?: NotificationMeta;
}

export class NotificationMapper {
  static toDomain(doc: NotificationDocument): Notification {
    return Notification.reconstitute({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      title: doc.title,
      message: doc.message,
      type: doc.type,
      isRead: doc.isRead,
      sentAt: doc.sentAt as Date,
      actionUrl: doc.actionUrl ?? undefined,
      meta: doc.meta
        ? {
            ...doc.meta,
            actorId: doc.meta.actorId?.toString(),
            targetId: doc.meta.targetId?.toString(),
          }
        : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toPersistence(entity: Notification): NotificationPersistence {
    return {
      _id:
        entity.id && Types.ObjectId.isValid(entity.id)
          ? new Types.ObjectId(entity.id)
          : undefined,
      userId: new Types.ObjectId(entity.userId),
      title: entity.title,
      message: entity.message,
      type: entity.type,
      isRead: entity.isRead,
      sentAt: entity.sentAt,
      actionUrl: entity.actionUrl,
      meta: entity.meta,
    };
  }
}
