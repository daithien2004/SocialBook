import { Module } from '@nestjs/common';
import { ChaptersApplicationModule } from './application/chapters/chapters-application.module';
import { ChaptersController } from './presentation/chapters/chapters.controller';
import { AIThrottleModule } from '@/modules/ai/presentation/public-api';
import { SingleChapterProcessor } from './infrastructure/queues/single-chapter/single-chapter.processor';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { ChaptersReadingRoomsIntegrationModule } from './application/public-api/chapters-reading-rooms-integration.module';

@Module({
  imports: [
    ChaptersApplicationModule,
    AIThrottleModule,
    ChaptersReadingRoomsIntegrationModule,
  ],
  controllers: [ChaptersController],
  providers: [...(isWorkerProcess() ? [SingleChapterProcessor] : [])],
})
export class ChaptersModule {}
