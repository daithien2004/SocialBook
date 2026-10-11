import { Module } from '@nestjs/common';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { TextToSpeechRepositoryModule } from './repositories/text-to-speech-repository.module';
import { TtsInfrastructureModule } from './tts-provider.module';
import { AudioQueueModule } from './queue/audio-queue.module';

@Module({
  imports: [
    MediaInfrastructureModule,
    TextToSpeechRepositoryModule,
    TtsInfrastructureModule,
    AudioQueueModule,
  ],
  exports: [
    TextToSpeechRepositoryModule,
    TtsInfrastructureModule,
    AudioQueueModule,
  ],
})
export class TextToSpeechInfrastructureModule {}
