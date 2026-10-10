import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  READING_PROGRESS_QUEUE,
  ReadingProgressQueuePort,
} from '../../application/reading-progress-queue.port';
import { DEFAULT_JOB_OPTIONS } from '@/shared/queue/default-job-options';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { ReadingProgressQueueAdapter } from './reading-progress-queue.adapter';
import { ReadingProgressQueueProcessor } from './reading-progress-queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: READING_PROGRESS_QUEUE,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    }),
  ],
  providers: [
    ReadingProgressQueueAdapter,
    {
      provide: ReadingProgressQueuePort,
      useExisting: ReadingProgressQueueAdapter,
    },
    ...(isWorkerProcess() ? [ReadingProgressQueueProcessor] : []),
  ],
  exports: [ReadingProgressQueuePort],
})
export class ReadingProgressQueueModule {}
