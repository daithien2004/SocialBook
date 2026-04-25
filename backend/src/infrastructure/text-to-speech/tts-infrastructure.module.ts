import { Module } from '@nestjs/common';
import { VoiceRSSProvider } from './voice-rss.provider';
import { ITextToSpeechProvider } from '@/domain/text-to-speech/interfaces/text-to-speech.provider.interface';
import { MediaInfrastructureModule } from '../media/media-infrastructure.module';

@Module({
  imports: [MediaInfrastructureModule],
  providers: [
    {
      provide: ITextToSpeechProvider,
      useClass: VoiceRSSProvider,
    },
  ],
  exports: [ITextToSpeechProvider],
})
export class TtsInfrastructureModule {}
