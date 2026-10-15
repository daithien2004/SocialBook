import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NotificationResult } from '@/modules/notifications/application/notification.result';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ nullable: true })
  actionUrl: string | null;

  @ApiPropertyOptional({ type: Object })
  meta?: {
    actorId: string;
    username?: string;
    image?: string;
    targetId?: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(notification: NotificationResult) {
    this.id = notification.id;
    this.userId = notification.userId;
    this.title = notification.title;
    this.message = notification.message;
    this.type = notification.type;
    this.isRead = notification.isRead;
    this.actionUrl = notification.actionUrl;
    this.createdAt = notification.createdAt;
    this.updatedAt = notification.updatedAt;

    if (notification.meta) {
      this.meta = {
        actorId: notification.meta.actorId || '',
        username: notification.meta.username,
        image: notification.meta.image,
        targetId: notification.meta.targetId,
      };
    }
  }

  static fromResult(notification: NotificationResult): NotificationResponseDto {
    return new NotificationResponseDto(notification);
  }

  static fromArray(
    notifications: NotificationResult[],
  ): NotificationResponseDto[] {
    return notifications.map((n) => new NotificationResponseDto(n));
  }
}
