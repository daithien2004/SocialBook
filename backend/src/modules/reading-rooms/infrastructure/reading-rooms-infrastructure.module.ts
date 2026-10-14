import { Module } from '@nestjs/common';

import { PresenceCachePort } from '../application/ports/external/presence-cache.port';
import { PresenceCacheAdapter } from './cache/presence-cache.adapter';
import { ReadingRoomsPersistenceModule } from './persistence/reading-rooms-persistence.module';
import { ReadingProgressQueueModule } from './queue/reading-progress-queue.module';
import { HighlightInsightLockPort } from '../application/ports/external/highlight-insight-lock.port';
import { HighlightInsightLockAdapter } from './cache/highlight-insight-lock.adapter';

@Module({
  imports: [ReadingRoomsPersistenceModule, ReadingProgressQueueModule],
  providers: [
    {
      provide: PresenceCachePort,
      useClass: PresenceCacheAdapter,
    },
    {
      provide: HighlightInsightLockPort,
      useClass: HighlightInsightLockAdapter,
    },
  ],
  exports: [
    ReadingRoomsPersistenceModule,
    ReadingProgressQueueModule,
    PresenceCachePort,
    HighlightInsightLockPort,
  ],
})
export class ReadingRoomsInfrastructureModule {}
