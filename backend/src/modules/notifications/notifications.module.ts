import { Module } from '@nestjs/common';
import { NotificationsApplicationModule } from './application/notifications-application.module';
import { NotificationController } from './presentation/notification.controller';

@Module({
  imports: [NotificationsApplicationModule],
  controllers: [NotificationController],
})
export class NotificationsModule {}
