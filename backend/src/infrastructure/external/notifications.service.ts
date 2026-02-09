import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from '../../presentation/notification/dto/create-notification.dto';
import { Server } from 'socket.io';
import { NotificationResponseDto } from '../../presentation/notification/dto/notification.response.dto';
import { CreateNotificationUseCase } from '../../application/notifications/use-cases/create-notification/create-notification.use-case';
import { GetUserNotificationsUseCase } from '../../application/notifications/use-cases/get-user-notification/get-user-notifications.use-case';
import { GetUserNotificationsQuery } from '../../application/notifications/use-cases/get-user-notification/get-user-notifications.query';
import { MarkNotificationReadUseCase } from '../../application/notifications/use-cases/mark-notification/mark-notification-read.use-case';
import { MarkNotificationReadCommand } from '../../application/notifications/use-cases/mark-notification/mark-notification-read.command';
import { CreateNotificationCommand } from '../../application/notifications/use-cases/create-notification/create-notification.command';

@Injectable()
export class NotificationsService {
  private server: Server | null = null;
  setServer(server: Server) { this.server = server; }

  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
  ) { }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  async create(dto: CreateNotificationDto) {
    const command = new CreateNotificationCommand(
      dto.userId,
      dto.title,
      dto.message,
      dto.type,
      dto.meta,
      dto.actionUrl
    );
    const notification = await this.createNotificationUseCase.execute(command);

    const responseDto = new NotificationResponseDto(notification);

    if (this.server) {
      this.server
        .to(this.userRoom(dto.userId))
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
}
