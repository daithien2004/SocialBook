import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  READING_PROGRESS_DEBOUNCE_MS,
  READING_PROGRESS_QUEUE,
  ReadingProgressQueuePort,
} from '../../application/reading-progress-queue.port';
import type { ReadingProgressJob } from '../../application/reading-progress-queue.port';

@Injectable()
export class ReadingProgressQueueAdapter implements ReadingProgressQueuePort {
  constructor(
    @InjectQueue(READING_PROGRESS_QUEUE)
    private readonly queue: Queue<ReadingProgressJob>,
  ) {}

  async enqueue(progress: ReadingProgressJob): Promise<void> {
    const deduplicationId = [
      progress.userId,
      progress.bookId,
      progress.chapterId,
    ].join(':');

    await this.queue.add('update-progress', progress, {
      delay: READING_PROGRESS_DEBOUNCE_MS,
      deduplication: {
        id: deduplicationId,
        ttl: READING_PROGRESS_DEBOUNCE_MS,
        replace: true,
        keepLastIfActive: true,
      },
    });
  }
}
