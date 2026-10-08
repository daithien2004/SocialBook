import { Module } from '@nestjs/common';
import { NotificationsApplicationModule } from '../../application/notifications-application.module';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [NotificationsApplicationModule],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsRealtimeModule {}
