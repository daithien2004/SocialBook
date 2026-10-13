import { Module } from '@nestjs/common';

import { IPresenceCachePort } from '../application/ports/external/presence-cache.port';
import { PresenceCacheAdapter } from './cache/presence-cache.adapter';
import { ReadingRoomsPostgresModule } from './postgres/reading-rooms-postgres.module';
import { ReadingProgressQueueModule } from './queue/reading-progress-queue.module';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { ReadingRoomRealtimeListener } from './realtime/reading-room-realtime.listener';
import { IHighlightInsightLockPort } from '../application/ports/external/highlight-insight-lock.port';
import { HighlightInsightLockAdapter } from './cache/highlight-insight-lock.adapter';

@Module({
  imports: [ReadingRoomsPostgresModule, ReadingProgressQueueModule],
  providers: [
    ...(isWorkerProcess() ? [ReadingRoomRealtimeListener] : []),
    {
      provide: IPresenceCachePort,
      useClass: PresenceCacheAdapter,
    },
    {
      provide: IHighlightInsightLockPort,
      useClass: HighlightInsightLockAdapter,
    },
  ],
  exports: [
    ReadingRoomsPostgresModule,
    ReadingProgressQueueModule,
    IPresenceCachePort,
    IHighlightInsightLockPort,
  ],
})
export class ReadingRoomsInfrastructureModule {}
