import { Module } from '@nestjs/common';
import { ElevenLabsAdapter } from './elevenlabs.adapter';
import { ITextToSpeechPort } from '@/domain/text-to-speech/interfaces/text-to-speech.port';
import { MediaInfrastructureModule } from '../media/media-infrastructure.module';

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
