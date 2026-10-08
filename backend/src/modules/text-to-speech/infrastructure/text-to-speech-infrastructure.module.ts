import { Module } from '@nestjs/common';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { TextToSpeechRepositoryModule } from './repositories/text-to-speech-repository.module';
import { TtsInfrastructureModule } from './tts-provider.module';

@Module({
  imports: [
    MediaInfrastructureModule,
    TextToSpeechRepositoryModule,
    TtsInfrastructureModule,
  ],
  exports: [TextToSpeechRepositoryModule, TtsInfrastructureModule],
})
export class TextToSpeechInfrastructureModule {}
