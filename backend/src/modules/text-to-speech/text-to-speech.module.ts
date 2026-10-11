import { Module } from '@nestjs/common';
import { TextToSpeechApplicationModule } from './application/text-to-speech-application.module';
import { TextToSpeechController } from './presentation/text-to-speech.controller';
import { TextToSpeechInfrastructureModule } from './infrastructure/text-to-speech-infrastructure.module';
import { AudioWorker } from './infrastructure/workers/audio.worker';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';

@Module({
  imports: [
    TextToSpeechApplicationModule,
    TextToSpeechInfrastructureModule,
    ChaptersRepositoryModule,
  ],
  controllers: [TextToSpeechController],
  providers: [...(isWorkerProcess() ? [AudioWorker] : [])],
})
export class TextToSpeechModule {}
