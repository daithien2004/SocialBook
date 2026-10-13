import { Prisma } from '@/core/database/generated/prisma/client';
import {
  Notification,
  NotificationMeta,
} from '@/modules/notifications/domain/entities/notification.entity';

type NotificationRow = Prisma.NotificationModel;

export class NotificationMapper {
  static toDomain(row: NotificationRow): Notification {
    return Notification.reconstitute({
      id: row.id,
      userId: row.userId,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.isRead,
      sentAt: row.sentAt,
      actionUrl: row.actionUrl ?? undefined,
      meta: this.toMeta(row.meta),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(
    notification: Notification,
  ): Prisma.NotificationCreateInput {
    const meta = notification.meta
      ? ({
          ...(notification.meta.actorId === undefined
            ? {}
            : { actorId: notification.meta.actorId }),
          ...(notification.meta.username === undefined
            ? {}
            : { username: notification.meta.username }),
          ...(notification.meta.image === undefined
            ? {}
            : { image: notification.meta.image }),
          ...(notification.meta.targetId === undefined
            ? {}
            : { targetId: notification.meta.targetId }),
        } satisfies Prisma.InputJsonObject)
      : undefined;

    return {
      id: notification.id,
      user: { connect: { id: notification.userId } },
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      sentAt: notification.sentAt,
      actionUrl: notification.actionUrl ?? null,
      meta,
    };
  }

  private static toMeta(
    value: Prisma.JsonValue | null,
  ): NotificationMeta | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return {
      ...(typeof value.actorId === 'string' ? { actorId: value.actorId } : {}),
      ...(typeof value.username === 'string'
        ? { username: value.username }
        : {}),
      ...(typeof value.image === 'string' ? { image: value.image } : {}),
      ...(typeof value.targetId === 'string'
        ? { targetId: value.targetId }
        : {}),
    };
  }
}
