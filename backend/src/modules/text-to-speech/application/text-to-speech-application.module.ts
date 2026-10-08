import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { DeleteChapterAudioHandler } from './commands/delete-chapter-audio/delete-chapter-audio.handler';
import { GenerateBookAudioHandler } from './commands/generate-book-audio/generate-book-audio.handler';
import { GenerateChapterAudioHandler } from './commands/generate-chapter-audio/generate-chapter-audio.handler';
import { GetChapterAudioHandler } from './queries/get-chapter-audio/get-chapter-audio.handler';
import { IncrementPlayCountHandler } from './commands/increment-play-count/increment-play-count.handler';
import { TextToSpeechInfrastructureModule } from '../infrastructure/text-to-speech-infrastructure.module';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { LanguageDetectorService } from './services/language-detector.service';
import { QueueModule } from '@/infrastructure/queue/queue.module';

@Module({
  imports: [
    CqrsModule,
    TextToSpeechInfrastructureModule,
    ChaptersRepositoryModule,
    IdGeneratorModule,
    QueueModule,
  ],
  providers: [
    DeleteChapterAudioHandler,
    GenerateBookAudioHandler,
    GenerateChapterAudioHandler,
    GetChapterAudioHandler,
    IncrementPlayCountHandler,
    LanguageDetectorService,
  ],
  exports: [
    DeleteChapterAudioHandler,
    GenerateBookAudioHandler,
    GenerateChapterAudioHandler,
    GetChapterAudioHandler,
    IncrementPlayCountHandler,
  ],
})
export class TextToSpeechApplicationModule {}
