import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IChaptersImportPort } from '@/domain/chapters/interfaces/chapters-import.port';
import { ChaptersApplicationModule } from '@/application/chapters/chapters-application.module';
import {
  ChaptersImportProcessor,
  CHAPTERS_IMPORT_QUEUE,
} from './chapters-import.processor';
import { ChaptersImportAdapter } from './chapters-import.adapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CHAPTERS_IMPORT_QUEUE,
    }),
    ChaptersApplicationModule,
  ],
  providers: [
    ChaptersImportProcessor,
    {
      provide: IChaptersImportPort,
      useClass: ChaptersImportAdapter,
    },
  ],
  exports: [IChaptersImportPort],
})
export class ChaptersImportModule {}
