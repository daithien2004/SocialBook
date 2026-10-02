import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IChaptersImportPort } from '@/domain/chapters/interfaces/chapters-import.port';
import {
  ChaptersImportProcessor,
  CHAPTERS_IMPORT_QUEUE,
} from './chapters-import.processor';
import { ChaptersImportAdapter } from './chapters-import.adapter';
import { CREATE_SINGLE_CHAPTER_QUEUE } from '@/application/chapters/processors/single-chapter.processor';
import { isWorkerProcess } from '@/common/utils/process-role.util';

/**
 * Retry policy cho job tạo chương con (A1). khai báo ở cấp queue để mọi job
 * enqueue từ `ChaptersImportProcessor` đều được retry + backoff mà không phải
 * lặp lại ở từng chỗ `add(...)`.
 */
export const CREATE_SINGLE_CHAPTER_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: 100,
} as const;

@Module({
  imports: [
    BullModule.registerQueue({
      name: CHAPTERS_IMPORT_QUEUE,
    }),
    BullModule.registerQueue({
      name: CREATE_SINGLE_CHAPTER_QUEUE,
      defaultJobOptions: CREATE_SINGLE_CHAPTER_JOB_OPTIONS,
    }),
  ],
  providers: [
    ...(isWorkerProcess() ? [ChaptersImportProcessor] : []),
    {
      provide: IChaptersImportPort,
      useClass: ChaptersImportAdapter,
    },
  ],
  exports: [IChaptersImportPort],
})
export class ChaptersImportModule {}
