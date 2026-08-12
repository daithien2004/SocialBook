import { Module } from '@nestjs/common';
import { ElevenLabsProvider } from './elevenlabs.provider';
import { LanguageDetectorService } from './language-detector.service';
import { ITextToSpeechProvider } from '@/domain/text-to-speech/interfaces/text-to-speech.provider.interface';
import { ILanguageDetector } from '@/domain/text-to-speech/interfaces/language-detector.interface';
import { MediaInfrastructureModule } from '../media/media-infrastructure.module';

@Module({
  imports: [MediaInfrastructureModule],
  providers: [
    {
      provide: ITextToSpeechProvider,
      useClass: ElevenLabsProvider,
    },
    {
      provide: ILanguageDetector,
      useClass: LanguageDetectorService,
    },
  ],
  exports: [ITextToSpeechProvider, ILanguageDetector],
})
export class TtsInfrastructureModule {}
