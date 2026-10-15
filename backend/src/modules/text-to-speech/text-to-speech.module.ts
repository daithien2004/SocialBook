import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TextToSpeechController } from './presentation/text-to-speech.controller';
import { TextToSpeechInfrastructureModule } from './infrastructure/text-to-speech-infrastructure.module';
import { AudioWorker } from './infrastructure/workers/audio.worker';
import { ChaptersTextToSpeechIntegrationModule } from '@/modules/chapters';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineTextToSpeechAbilities } from './application/policies/text-to-speech.ability';
import { ChapterAudioGenerationService } from './application/services/chapter-audio-generation.service';
import { LanguageDetectorService } from './application/services/language-detector.service';
import { DeleteChapterAudioHandler } from './application/commands/delete-chapter-audio/delete-chapter-audio.handler';
import { GenerateBookAudioHandler } from './application/commands/generate-book-audio/generate-book-audio.handler';
import { GenerateChapterAudioHandler } from './application/commands/generate-chapter-audio/generate-chapter-audio.handler';
import { IncrementPlayCountHandler } from './application/commands/increment-play-count/increment-play-count.handler';
import { GetAudioByIdHandler } from './application/queries/get-audio-by-id/get-audio-by-id.handler';
import { GetChapterAudioHandler } from './application/queries/get-chapter-audio/get-chapter-audio.handler';

@Module({
  imports: [
    CqrsModule,
    TextToSpeechInfrastructureModule,
    ChaptersTextToSpeechIntegrationModule,
    IdGeneratorModule,
  ],
  controllers: [TextToSpeechController],
  providers: [
    DeleteChapterAudioHandler,
    GenerateBookAudioHandler,
    GenerateChapterAudioHandler,
    GetAudioByIdHandler,
    GetChapterAudioHandler,
    IncrementPlayCountHandler,
    ChapterAudioGenerationService,
    LanguageDetectorService,
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineTextToSpeechAbilities]),
    },
    PoliciesGuard,
    ...(isWorkerProcess() ? [AudioWorker] : []),
  ],
})
export class TextToSpeechModule {}
