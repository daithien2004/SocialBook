import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationQueueAdapter } from './notification-queue.adapter';
import { INotificationQueuePort } from '@/application/ports/notification-queue.port';
import { AudioQueueAdapter } from './audio-queue.adapter';
import { IAudioQueuePort } from '@/application/ports/audio-queue.port';
import { DEFAULT_JOB_OPTIONS } from '@/shared/queue/default-job-options';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    }),
    BullModule.registerQueue({
      name: 'audio-generation',
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    }),
  ],
  providers: [
    {
      provide: INotificationQueuePort,
      useClass: NotificationQueueAdapter,
    },
    {
      provide: IAudioQueuePort,
      useClass: AudioQueueAdapter,
    },
  ],
  exports: [BullModule, INotificationQueuePort, IAudioQueuePort],
})
export class QueueModule {}
