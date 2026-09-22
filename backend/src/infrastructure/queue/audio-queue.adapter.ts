import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IAudioQueuePort } from '@/application/ports/audio-queue.port';
import { GenerateAudioJobPayload } from '@/application/text-to-speech/jobs/tts-job.payload';

@Injectable()
export class AudioQueueAdapter implements IAudioQueuePort {
  private readonly logger = new Logger(AudioQueueAdapter.name);

  constructor(
    @InjectQueue('audio-generation') private readonly audioQueue: Queue,
  ) {}

  async queueAudioGeneration(payload: GenerateAudioJobPayload): Promise<void> {
    try {
      await this.audioQueue.add('generate.audio', payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: 100, // keep last 100 failed jobs for debugging
      });
      this.logger.debug(
        `Queued generate.audio job for chapter ${payload.chapterId}`,
      );
    } catch (error) {
      this.logger.error('Failed to queue generate.audio job', error);
      throw error;
    }
  }
}
