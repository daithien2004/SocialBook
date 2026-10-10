import { Module } from '@nestjs/common';
import { ChromaApplicationModule } from './application/chroma-application.module';
import { ChromaController } from './presentation/chroma.controller';
import { AIThrottleModule } from '@/modules/ai/presentation/public-api';

@Module({
  imports: [ChromaApplicationModule, AIThrottleModule],
  controllers: [ChromaController],
})
export class ChromaModule {}
