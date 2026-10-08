import { Module } from '@nestjs/common';
import { ElevenLabsAdapter } from './adapters/elevenlabs.adapter';
import { ITextToSpeechPort } from '@/modules/text-to-speech/domain/interfaces/text-to-speech.port';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';

@Module({
  imports: [MediaInfrastructureModule],
  providers: [
    {
      provide: ITextToSpeechPort,
      useClass: ElevenLabsAdapter,
    },
  ],
  exports: [ITextToSpeechPort],
})
export class TtsInfrastructureModule {}
