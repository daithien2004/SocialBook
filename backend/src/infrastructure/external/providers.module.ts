import { Module } from '@nestjs/common';
import { ITextToSpeechProvider } from '@/domain/text-to-speech/interfaces/text-to-speech.provider.interface';
import { VoiceRSSProvider } from './voice-rss.provider';
import { ExternalServicesModule } from './external-services.module';

@Module({
  imports: [ExternalServicesModule],
  providers: [
    {
      provide: ITextToSpeechProvider,
      useClass: VoiceRSSProvider,
    },
  ],
  exports: [ITextToSpeechProvider],
})
export class ProvidersModule {}
