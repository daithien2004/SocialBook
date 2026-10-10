import { Module } from '@nestjs/common';

import { IPresenceCachePort } from '../domain/interfaces/presence-cache.port';
import { PresenceCacheAdapter } from './cache/presence-cache.adapter';
import { ReadingRoomsRepositoryModule } from './mongo/repositories/reading-rooms-repository.module';
import { ReadingProgressQueueModule } from './queue/reading-progress-queue.module';

@Module({
  imports: [ReadingRoomsRepositoryModule, ReadingProgressQueueModule],
  providers: [
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
