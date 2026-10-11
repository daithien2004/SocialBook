import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { INotificationQueuePort } from '../../application/public-api';
import { DEFAULT_JOB_OPTIONS } from '@/shared/queue/default-job-options';
import { NotificationQueueAdapter } from './notification-queue.adapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    }),
  ],
  providers: [
    { provide: INotificationQueuePort, useClass: NotificationQueueAdapter },
  ],
  exports: [INotificationQueuePort],
})
export class NotificationQueueModule {}
