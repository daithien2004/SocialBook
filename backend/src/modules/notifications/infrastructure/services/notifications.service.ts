import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from '../../dto/create-notification.dto';
import { Server } from 'socket.io';
import { NotificationModal } from '../../modals/notification.modal';
import { CreateNotificationUseCase } from '../../application/use-cases/create-notification.use-case';
import { GetUserNotificationsUseCase } from '../../application/use-cases/get-user-notifications.use-case';
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read.use-case';

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

    // Map entity to Modal/DTO for socket
    // Assuming NotificationModal has a constructor or static method to map from entity
    // or we map manually if Modal expects specific structure different from Entity
    // Let's modify NotificationModal to accept Entity if needed, or map here.
    const modal = new NotificationModal(notification as any); // Temporary cast, will check Modal

    if (this.server) {
      this.server
        .to(this.userRoom(dto.userId))
        .emit('notification:new', modal);
    }

    return modal;
  }

  async findAllByUser(userId: string, limit = 50) {
    const notifications = await this.getUserNotificationsUseCase.execute(userId, limit);
    return NotificationModal.fromArray(notifications as any[]);
  }

  async markRead(userId: string, id: string) {
    await this.markNotificationReadUseCase.execute(userId, id);
    if (this.server) {
      this.server.to(this.userRoom(userId)).emit('notification:read', { id });
    }
    return { ok: true };
  }
}
