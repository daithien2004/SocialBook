import { Module } from '@nestjs/common';
import { DeleteChapterAudioUseCase } from './use-cases/delete-chapter-audio.use-case';
import { GenerateBookAudioUseCase } from './use-cases/generate-book-audio.use-case';
import { GenerateChapterAudioUseCase } from './use-cases/generate-chapter-audio.use-case';
import { GetChapterAudioUseCase } from './use-cases/get-chapter-audio.use-case';
import { IncrementPlayCountUseCase } from './use-cases/increment-play-count.use-case';
import { TextToSpeechRepositoryModule } from '@/infrastructure/database/repositories/text-to-speech/text-to-speech-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { TtsInfrastructureModule } from '@/infrastructure/text-to-speech/tts-infrastructure.module';
import { LanguageDetectorService } from './services/language-detector.service';

@Module({
  imports: [
    TextToSpeechRepositoryModule,
    ChaptersRepositoryModule,
    IdGeneratorModule,
    TtsInfrastructureModule,
  ],
  providers: [
    DeleteChapterAudioUseCase,
    GenerateBookAudioUseCase,
    GenerateChapterAudioUseCase,
    GetChapterAudioUseCase,
    IncrementPlayCountUseCase,
    LanguageDetectorService,
  ],
  exports: [
    DeleteChapterAudioUseCase,
    GenerateBookAudioUseCase,
    GenerateChapterAudioUseCase,
    GetChapterAudioUseCase,
    IncrementPlayCountUseCase,
  ],
})
export class TextToSpeechApplicationModule {}
