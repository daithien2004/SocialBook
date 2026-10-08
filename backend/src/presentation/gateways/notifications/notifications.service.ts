import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { CreateNotificationCommand } from '@/modules/notifications/application/public-api';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationResponseDto } from '@/modules/notifications/presentation/dto/notification.response.dto';
import { CreateNotificationHandler } from '@/modules/notifications/application/public-api';
import { GetUserNotificationsHandler } from '@/modules/notifications/application/public-api';
import { GetUserNotificationsQuery } from '@/modules/notifications/application/public-api';
import { MarkNotificationReadHandler } from '@/modules/notifications/application/public-api';
import { MarkNotificationReadCommand } from '@/modules/notifications/application/public-api';
import { MarkAllNotificationsReadHandler } from '@/modules/notifications/application/public-api';
import { MarkAllNotificationsReadCommand } from '@/modules/notifications/application/public-api';

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
