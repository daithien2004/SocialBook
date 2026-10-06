import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { CreateNotificationCommand } from '@/application/notifications/commands/create-notification/create-notification.command';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationResponseDto } from '@/presentation/notification/dto/notification.response.dto';
import { CreateNotificationHandler } from '@/application/notifications/commands/create-notification/create-notification.handler';
import { GetUserNotificationsHandler } from '@/application/notifications/queries/get-user-notification/get-user-notifications.handler';
import { GetUserNotificationsQuery } from '@/application/notifications/queries/get-user-notification/get-user-notifications.query';
import { MarkNotificationReadHandler } from '@/application/notifications/commands/mark-notification/mark-notification-read.handler';
import { MarkNotificationReadCommand } from '@/application/notifications/commands/mark-notification/mark-notification-read.command';
import { MarkAllNotificationsReadHandler } from '@/application/notifications/commands/mark-notification/mark-all-notifications-read.handler';
import { MarkAllNotificationsReadCommand } from '@/application/notifications/commands/mark-notification/mark-all-notifications-read.command';

@Injectable()
export class NotificationsService {
  private server: Server | null = null;
  setServer(server: Server) {
    this.server = server;
  }

  constructor(
    private readonly createNotificationUseCase: CreateNotificationHandler,
    private readonly getUserNotificationsUseCase: GetUserNotificationsHandler,
    private readonly markNotificationReadUseCase: MarkNotificationReadHandler,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadHandler,
  ) {}

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  async create(data: CreateNotificationDto) {
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
