import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IChaptersImportService } from '@/domain/chapters/interfaces/chapters-import.interface';
import { ChaptersApplicationModule } from '@/application/chapters/chapters-application.module';
import {
  ChaptersImportProcessor,
  CHAPTERS_IMPORT_QUEUE,
} from './chapters-import.processor';
import { ChaptersImportService } from './chapters-import.service';
import { StartChaptersImportUseCase } from '@/application/chapters/use-cases/start-chapters-import/start-chapters-import.use-case';
import { GetChaptersImportStatusUseCase } from '@/application/chapters/use-cases/get-chapters-import-status/get-chapters-import-status.use-case';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CHAPTERS_IMPORT_QUEUE,
    }),
    ChaptersApplicationModule,
  ],
  providers: [
    ChaptersImportProcessor,
    StartChaptersImportUseCase,
    GetChaptersImportStatusUseCase,
    {
      provide: IChaptersImportService,
      useClass: ChaptersImportService,
    },
  ],
  exports: [
    IChaptersImportService,
    StartChaptersImportUseCase,
    GetChaptersImportStatusUseCase,
  ],
})
export class ChaptersImportModule {}
