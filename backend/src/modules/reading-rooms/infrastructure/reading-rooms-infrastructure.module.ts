import { Module } from '@nestjs/common';

import { IPresenceCachePort } from '../domain/interfaces/presence-cache.port';
import { PresenceCacheAdapter } from './cache/presence-cache.adapter';
import { ReadingRoomsRepositoryModule } from './mongo/repositories/reading-rooms-repository.module';
import { ReadingProgressQueueModule } from './queue/reading-progress-queue.module';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { ReadingRoomRealtimeListener } from './realtime/reading-room-realtime.listener';

@Module({
  imports: [ReadingRoomsRepositoryModule, ReadingProgressQueueModule],
  providers: [
    ...(isWorkerProcess() ? [ReadingRoomRealtimeListener] : []),
    {
      provide: IPresenceCachePort,
      useClass: PresenceCacheAdapter,
    },
  ],
  exports: [
    ReadingRoomsRepositoryModule,
    ReadingProgressQueueModule,
    IPresenceCachePort,
  ],
})
export class ReadingRoomsInfrastructureModule {}
