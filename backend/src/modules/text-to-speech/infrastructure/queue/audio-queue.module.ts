import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AudioQueuePort } from '../../application/audio-queue.port';
import { AudioQueueAdapter } from './audio-queue.adapter';

@Module({
  imports: [BullModule.registerQueue({ name: 'audio-generation' })],
  providers: [{ provide: AudioQueuePort, useClass: AudioQueueAdapter }],
  exports: [AudioQueuePort],
})
export class AudioQueueModule {}
