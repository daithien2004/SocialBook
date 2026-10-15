import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
import { GetChapterAudioSourceHandler } from '../chapters/queries/get-audio-source/get-chapter-audio-source.handler';
import { GetBookAudioSourcesHandler } from '../chapters/queries/get-book-audio-sources/get-book-audio-sources.handler';
import { UpdateChapterAudioStatusHandler } from '../chapters/commands/update-audio-status/update-chapter-audio-status.handler';

@Module({
  imports: [CqrsModule, ChaptersRepositoryModule],
  providers: [
    GetChapterAudioSourceHandler,
    GetBookAudioSourcesHandler,
    UpdateChapterAudioStatusHandler,
  ],
})
export class ChaptersTextToSpeechIntegrationModule {}
