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

@Module({
  imports: [
    BullModule.registerQueue({
      name: CHAPTERS_IMPORT_QUEUE,
    }),
    BullModule.registerQueue({
      name: CREATE_SINGLE_CHAPTER_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
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
