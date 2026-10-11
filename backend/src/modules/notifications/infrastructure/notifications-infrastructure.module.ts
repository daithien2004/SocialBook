import { Module } from '@nestjs/common';
import { NotificationsRepositoryModule } from './repositories/notifications-repository.module';
import { NotificationQueueModule } from './queue/notification-queue.module';

@Module({
  imports: [NotificationsRepositoryModule, NotificationQueueModule],
  exports: [NotificationsRepositoryModule, NotificationQueueModule],
})
export class NotificationsInfrastructureModule {}
