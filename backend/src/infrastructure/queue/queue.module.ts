import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationQueueAdapter } from './notification-queue.adapter';
import { INotificationQueuePort } from '@/application/ports/notification-queue.port';
import { AudioQueueAdapter } from './audio-queue.adapter';
import { IAudioQueuePort } from '@/application/ports/audio-queue.port';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    BullModule.registerQueue({
      name: 'audio-generation',
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
