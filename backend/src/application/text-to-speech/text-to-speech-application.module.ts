import { Module } from '@nestjs/common';
import { DeleteChapterAudioUseCase } from './use-cases/delete-chapter-audio.use-case';
import { GenerateBookAudioUseCase } from './use-cases/generate-book-audio.use-case';
import { GenerateChapterAudioUseCase } from './use-cases/generate-chapter-audio.use-case';
import { GetChapterAudioUseCase } from './use-cases/get-chapter-audio.use-case';
import { IncrementPlayCountUseCase } from './use-cases/increment-play-count.use-case';
import { TextToSpeechRepositoryModule } from '@/infrastructure/database/repositories/text-to-speech/text-to-speech-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [
    TextToSpeechRepositoryModule,
    ChaptersRepositoryModule,
    IdGeneratorModule,
    InfrastructureModule,
  ],
  providers: [
    DeleteChapterAudioUseCase,
    GenerateBookAudioUseCase,
    GenerateChapterAudioUseCase,
    GetChapterAudioUseCase,
    IncrementPlayCountUseCase,
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
