import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { INotificationRepository } from '@/modules/notifications/domain/repositories/notification.repository.interface';
import { Notification } from '@/modules/notifications/domain/entities/notification.entity';
import { NotificationMapper } from './notification.mapper';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: Notification): Promise<Notification> {
    const row = await this.prisma.notification.create({
      data: NotificationMapper.toPersistence(notification),
    });
    return NotificationMapper.toDomain(row);
  }

  async findAllByUser(
    userId: string,
    limit = 50,
    offset = 0,
    isRead?: boolean,
  ): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(isRead === undefined ? {} : { isRead }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit,
    });
    return rows.map((row) => NotificationMapper.toDomain(row));
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
