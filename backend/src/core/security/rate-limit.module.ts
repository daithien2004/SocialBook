import { Module } from '@nestjs/common';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { RedisConnectionModule } from '../redis/redis-connection.module';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [RedisConnectionModule],
      inject: [getRedisConnectionToken()],
      useFactory: (redis: Redis) => ({
        throttlers: [{ name: 'global', ttl: 60_000, limit: 100 }],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
