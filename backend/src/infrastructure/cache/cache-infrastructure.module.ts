import { Global, Module } from '@nestjs/common';
import { ICachePort } from '@/shared/domain/cache.port';
import { RedisCacheAdapter } from './redis-cache.adapter';

@Global()
@Module({
  providers: [
    {
      provide: ICachePort,
      useClass: RedisCacheAdapter,
    },
  ],
  exports: [ICachePort],
})
export class CacheInfrastructureModule {}
