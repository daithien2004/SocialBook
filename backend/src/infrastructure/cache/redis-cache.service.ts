import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';

@Injectable()
export class RedisCacheService implements ICacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error(
        `Failed to get cache key "${key}": ${(error as Error).message}`,
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds !== undefined) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(
        `Failed to set cache key "${key}": ${(error as Error).message}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete cache key "${key}": ${(error as Error).message}`,
      );
    }
  }

  async reset(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error(
        `Failed to reset cache: ${(error as Error).message}`,
      );
    }
  }
}
