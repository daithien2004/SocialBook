import { Module } from '@nestjs/common';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { TextToSpeechPersistenceModule } from './persistence/text-to-speech-persistence.module';
import { TtsInfrastructureModule } from './tts-provider.module';
import { AudioQueueModule } from './queue/audio-queue.module';

@Module({
  imports: [
    MediaInfrastructureModule,
    TextToSpeechPersistenceModule,
    TtsInfrastructureModule,
    AudioQueueModule,
  ],
  exports: [
    TextToSpeechPersistenceModule,
    TtsInfrastructureModule,
    AudioQueueModule,
  ],
})
export class TextToSpeechInfrastructureModule {}
