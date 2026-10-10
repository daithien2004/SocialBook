import { Module } from '@nestjs/common';
import { ChaptersApplicationModule } from './application/chapters/chapters-application.module';
import { ChaptersController } from './presentation/chapters/chapters.controller';
import { AIThrottleModule } from '@/modules/ai/presentation/public-api';

@Module({
  imports: [ChaptersApplicationModule, AIThrottleModule],
  controllers: [ChaptersController],
})
export class ChaptersModule {}
