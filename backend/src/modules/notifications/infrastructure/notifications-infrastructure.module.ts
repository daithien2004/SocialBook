import { Module } from '@nestjs/common';
import { NotificationsRepositoryModule } from './repositories/notifications-repository.module';
import { NotificationQueueModule } from './queue/notification-queue.module';
import { NotificationRetentionWorker } from './workers/notification-retention.worker';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';

@Module({
  imports: [NotificationsRepositoryModule, NotificationQueueModule],
  providers: [...(isWorkerProcess() ? [NotificationRetentionWorker] : [])],
  exports: [NotificationsRepositoryModule, NotificationQueueModule],
})
export class NotificationsInfrastructureModule {}
