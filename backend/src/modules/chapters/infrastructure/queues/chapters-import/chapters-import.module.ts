import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IChaptersImportPort } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';
import {
  ChaptersImportProcessor,
  CHAPTERS_IMPORT_QUEUE,
} from './chapters-import.processor';
import { ChaptersImportAdapter } from './chapters-import.adapter';
import { CREATE_SINGLE_CHAPTER_QUEUE } from '@/modules/chapters/application/chapters/processors/single-chapter.processor';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';

/**
 * Retry policy cho job táº¡o chÆ°Æ¡ng con (A1). khai bÃ¡o á»Ÿ cáº¥p queue Ä‘á»ƒ má»i job
 * enqueue tá»« `ChaptersImportProcessor` Ä‘á»u Ä‘Æ°á»£c retry + backoff mÃ  khÃ´ng pháº£i
 * láº·p láº¡i á»Ÿ tá»«ng chá»— `add(...)`.
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
