import { Module } from '@nestjs/common';

import { IPresenceCachePort } from '../domain/interfaces/presence-cache.port';
import { PresenceCacheAdapter } from './cache/presence-cache.adapter';
import { ReadingRoomsRepositoryModule } from './mongo/repositories/reading-rooms-repository.module';

@Module({
  imports: [ReadingRoomsRepositoryModule],
  providers: [
    {
      provide: IPresenceCachePort,
      useClass: PresenceCacheAdapter,
    },
  ],
  exports: [ReadingRoomsRepositoryModule, IPresenceCachePort],
})
export class ReadingRoomsInfrastructureModule {}
