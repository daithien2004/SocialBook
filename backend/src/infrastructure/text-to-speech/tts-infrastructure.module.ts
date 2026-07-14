import { Module } from '@nestjs/common';
import { ElevenLabsProvider } from './elevenlabs.provider';
import { ITextToSpeechProvider } from '@/domain/text-to-speech/interfaces/text-to-speech.provider.interface';
import { MediaInfrastructureModule } from '../media/media-infrastructure.module';

@Module({
  imports: [MediaInfrastructureModule],
  providers: [
    {
      provide: ITextToSpeechProvider,
      useClass: ElevenLabsProvider,
    },
  ],
  exports: [ITextToSpeechProvider],
})
export class TtsInfrastructureModule {}
