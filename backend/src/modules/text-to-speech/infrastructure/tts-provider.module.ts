import { Module } from '@nestjs/common';
import { ElevenLabsAdapter } from './adapters/elevenlabs.adapter';
import { TextToSpeechProvider } from '@/modules/text-to-speech/domain/ports/text-to-speech.provider';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';

@Module({
  imports: [MediaInfrastructureModule],
  providers: [
    {
      provide: TextToSpeechProvider,
      useClass: ElevenLabsAdapter,
    },
  ],
  exports: [TextToSpeechProvider],
})
export class TtsInfrastructureModule {}
