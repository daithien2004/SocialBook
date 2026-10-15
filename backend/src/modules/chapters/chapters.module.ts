import { Module } from '@nestjs/common';
import { ChaptersApplicationModule } from './application/chapters/chapters-application.module';
import { ChaptersController } from './presentation/chapters/chapters.controller';
import { AIThrottleModule } from '@/modules/ai/presentation/public-api';
import { SingleChapterProcessor } from './infrastructure/queues/single-chapter/single-chapter.processor';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { ChaptersReadingRoomsIntegrationModule } from './application/public-api/chapters-reading-rooms-integration.module';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineChapterAbilities } from './application/policies/chapter.ability';
import { ChaptersTextToSpeechIntegrationModule } from './application/public-api/chapters-text-to-speech-integration.module';

@Module({
  imports: [
    ChaptersApplicationModule,
    AIThrottleModule,
    ChaptersReadingRoomsIntegrationModule,
    ChaptersTextToSpeechIntegrationModule,
  ],
  controllers: [ChaptersController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineChapterAbilities]),
    },
    PoliciesGuard,
    ...(isWorkerProcess() ? [SingleChapterProcessor] : []),
  ],
})
export class ChaptersModule {}
