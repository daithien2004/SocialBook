import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { CreateNotificationCommand } from '@/application/notifications/use-cases/create-notification/create-notification.command';
import { CreateNotificationInput } from '@/infrastructure/notifications/dto/create-notification-input.interface';
import { NotificationResponseDto } from '@/presentation/notification/dto/notification.response.dto';
import { CreateNotificationUseCase } from '@/application/notifications/use-cases/create-notification/create-notification.use-case';
import { GetUserNotificationsUseCase } from '@/application/notifications/use-cases/get-user-notification/get-user-notifications.use-case';
import { GetUserNotificationsQuery } from '@/application/notifications/use-cases/get-user-notification/get-user-notifications.query';
import { MarkNotificationReadUseCase } from '@/application/notifications/use-cases/mark-notification/mark-notification-read.use-case';
import { MarkNotificationReadCommand } from '@/application/notifications/use-cases/mark-notification/mark-notification-read.command';
import { MarkAllNotificationsReadUseCase } from '@/application/notifications/use-cases/mark-notification/mark-all-notifications-read.use-case';
import { MarkAllNotificationsReadCommand } from '@/application/notifications/use-cases/mark-notification/mark-all-notifications-read.command';

@Injectable()
export class NotificationsService {
  private server: Server | null = null;
  setServer(server: Server) {
    this.server = server;
  }

  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
  ) {}

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  async create(data: CreateNotificationInput) {
    const command = new CreateNotificationCommand(
      data.userId,
      data.title,
      data.message,
      data.type,
      data.meta,
      data.actionUrl,
    );
    const notification = await this.createNotificationUseCase.execute(command);

    const responseDto = new NotificationResponseDto(notification);

    if (this.server) {
      this.server
        .to(this.userRoom(data.userId))
        .emit('notification:new', responseDto);
    }
    return responseDto;
  }

  async findAllByUser(userId: string, limit = 50) {
    const query = new GetUserNotificationsQuery(userId, 1, limit);
    const notifications = await this.getUserNotificationsUseCase.execute(query);
    return NotificationResponseDto.fromArray(notifications);
  }

  async markRead(userId: string, id: string) {
    const command = new MarkNotificationReadCommand(userId, id);
    await this.markNotificationReadUseCase.execute(command);
    if (this.server) {
      this.server.to(this.userRoom(userId)).emit('notification:read', { id });
    }
    return { ok: true };
  }

  async markAllRead(userId: string) {
    const command = new MarkAllNotificationsReadCommand(userId);
    await this.markAllNotificationsReadUseCase.execute(command);
    if (this.server) {
      this.server.to(this.userRoom(userId)).emit('notification:readAll');
    }
    return { ok: true };
  }
}
