import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsApplicationModule } from '@/application/notifications/notifications-application.module';

@Module({
  imports: [NotificationsApplicationModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsInfrastructureModule {}
