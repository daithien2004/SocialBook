import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { IAudioQueuePort } from '../../application/public-api';
import { AudioQueueAdapter } from './audio-queue.adapter';

@Module({
  imports: [BullModule.registerQueue({ name: 'audio-generation' })],
  providers: [{ provide: IAudioQueuePort, useClass: AudioQueueAdapter }],
  exports: [IAudioQueuePort],
})
export class AudioQueueModule {}
