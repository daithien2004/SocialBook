import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from '../../../application/notifications/dto/create-notification.dto';
import { Server } from 'socket.io';
import { NotificationResponseDto } from '../../../application/notifications/dto/notification.response.dto';
import { CreateNotificationUseCase } from '../../../application/notifications/use-cases/create-notification.use-case';
import { GetUserNotificationsUseCase } from '../../../application/notifications/use-cases/get-user-notifications.use-case';
import { MarkNotificationReadUseCase } from '../../../application/notifications/use-cases/mark-notification-read.use-case';

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
    const notification = await this.createNotificationUseCase.execute(
        dto.userId,
        dto.title,
        dto.message,
        dto.type,
        dto.meta,
        dto.actionUrl
    );

    const responseDto = new NotificationResponseDto(notification);

    if (this.server) {
      this.server
        .to(this.userRoom(dto.userId))
        .emit('notification:new', responseDto);
    }

    return responseDto;
  }

  async findAllByUser(userId: string, limit = 50) {
    const notifications = await this.getUserNotificationsUseCase.execute(userId, limit);
    return NotificationResponseDto.fromArray(notifications);
  }

  async markRead(userId: string, id: string) {
    await this.markNotificationReadUseCase.execute(userId, id);
    if (this.server) {
      this.server.to(this.userRoom(userId)).emit('notification:read', { id });
    }
    return { ok: true };
  }
}
