import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ChaptersApplicationModule } from '@/application/chapters/chapters-application.module';

import { ChaptersImportProcessor, CHAPTERS_IMPORT_QUEUE } from './chapters-import.processor';
import { ChaptersImportService } from './chapters-import.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CHAPTERS_IMPORT_QUEUE,
    }),
    forwardRef(() => ChaptersApplicationModule),
  ],
  providers: [ChaptersImportProcessor, ChaptersImportService],
  exports: [ChaptersImportService],
})
export class ChaptersImportModule {}
