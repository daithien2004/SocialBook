import { Module } from '@nestjs/common';
import { NotificationsApplicationModule } from './application/notifications-application.module';
import { NotificationController } from './presentation/notification.controller';
import { NotificationsRealtimeModule } from './presentation/realtime/notifications-realtime.module';

@Module({
  imports: [NotificationsApplicationModule, NotificationsRealtimeModule],
  controllers: [NotificationController],
})
export class NotificationsModule {}
